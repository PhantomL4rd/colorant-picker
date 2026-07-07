/**
 * 色調和アルゴリズム
 *
 * colorjs.io の {space, coords} 形式で色を扱う。
 * helmlab は colorjs.io 公式リリース後に統合予定（現状は二刀流）。
 */

import { Helmlab } from 'helmlab';
import type { DyeCandidate, DyeProps, HarmonyPattern, Oklab, Oklch, Rgb } from '$lib/types';
import { CLASH_CONFIG, HARMONY_ANGLES, HUE_CIRCLE_MAX } from '$lib/constants/color';
import { deltaE2000, rgbToHex, toOklab, toOklch, toRgb } from './colorConversion';
import { selectMonochromaticDyes } from './selector/monochromatic';

const helmlab = new Helmlab();
const helmLabByDyeId = new Map<string, [number, number, number]>();

function helmLabOf(dye: DyeProps): [number, number, number] {
  const cached = helmLabByDyeId.get(dye.id);
  if (cached) return cached;
  const lab = helmlab.fromHex(dye.hex);
  helmLabByDyeId.set(dye.id, lab);
  return lab;
}

const {
  TRIADIC_OFFSET_1,
  TRIADIC_OFFSET_2,
  COMPLEMENTARY,
  SPLIT_COMPLEMENTARY_ADJUSTMENT,
  ANALOGOUS_RANGE,
  SIMILAR_RANGE,
  CONTRAST_OFFSET,
} = HARMONY_ANGLES;

// トライアド（三色配色）- 色相環で120度ずつ離れた色
export function calculateTriadic(baseHue: number): [number, number] {
  return [
    (baseHue + TRIADIC_OFFSET_1) % HUE_CIRCLE_MAX,
    (baseHue + TRIADIC_OFFSET_2) % HUE_CIRCLE_MAX,
  ];
}

// スプリット・コンプリメンタリー - 補色の両隣の色
export function calculateSplitComplementary(baseHue: number): [number, number] {
  const complement = (baseHue + COMPLEMENTARY) % HUE_CIRCLE_MAX;
  return [
    (complement - SPLIT_COMPLEMENTARY_ADJUSTMENT + HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX,
    (complement + SPLIT_COMPLEMENTARY_ADJUSTMENT) % HUE_CIRCLE_MAX,
  ];
}

// アナログ（類似色）- 色相環で隣接する色
export function calculateAnalogous(baseHue: number): [number, number] {
  return [
    (baseHue - ANALOGOUS_RANGE + HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX,
    (baseHue + ANALOGOUS_RANGE) % HUE_CIRCLE_MAX,
  ];
}

// 類似色 - 近い色相での組み合わせ
export function calculateSimilar(baseHue: number): [number, number] {
  return [
    (baseHue - SIMILAR_RANGE + HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX,
    (baseHue + SIMILAR_RANGE) % HUE_CIRCLE_MAX,
  ];
}

// コントラスト - 補色関係を含む組み合わせ
export function calculateContrast(baseHue: number): [number, number] {
  return [(baseHue + COMPLEMENTARY) % HUE_CIRCLE_MAX, (baseHue + CONTRAST_OFFSET) % HUE_CIRCLE_MAX];
}

// helmlab フォールバック: 主候補 (CIEDE2000 最近傍) の ΔE00 がこの閾値を超えたら、
// helmlab の知覚距離 (distanceFromLab) で全プールから最近傍を選び直す。
// helmlab は「他の色空間で思ったとおりにならない時の最終手段」の位置付け。
// 常時発火しないよう、CIEDE2000 で「明らかに違う色」相当の 8 に設定
// （JND ≈ 2.3、5 は「よく見れば差が分かる」、10+ は「別系統」の目安）。
// 旧 hue±45° / excess≤0.05 / chroma ガードは廃止し、helmlab に一任。
const HELM_FALLBACK_DELTA_THRESHOLD = 8;

/**
 * Find the nearest dyes for each targets in a palette based on CIEDE2000.
 *
 * - primary: 全プールから CIEDE2000 最近傍を選ぶ
 * - helmlab フォールバック: 主候補 ΔE00 が閾値超なら helmlab 知覚距離で再探索
 *   「Rose Pink contrast で Cream Yellow が選ばれる」のような色相意図破綻を防ぐ
 */
export function findNearestDyesInOklab(targets: Rgb[], palette: DyeProps[]): DyeCandidate[] {
  const perTarget = targets.map((target) => {
    const targetOklab = toOklab(target);
    const candidates: DyeCandidate[] = palette
      .map((dye) => ({ dye, delta: deltaE2000(targetOklab, dye.oklab) }))
      .sort((a, b) => a.delta - b.delta);
    return { target, targetOklab, candidates };
  });

  const results: DyeCandidate[] = [];
  const used = new Set<string>();
  for (const { target, targetOklab, candidates } of perTarget) {
    const primary = candidates.find((c) => !used.has(c.dye.id));
    if (!primary) continue;

    let chosen = primary;
    if (primary.delta > HELM_FALLBACK_DELTA_THRESHOLD) {
      const targetHelm = helmlab.fromHex(rgbToHex(target));
      let bestDist = Number.POSITIVE_INFINITY;
      let bestDye: DyeProps | null = null;
      for (const dye of palette) {
        if (used.has(dye.id)) continue;
        const dist = helmlab.distanceFromLab(targetHelm, helmLabOf(dye));
        if (dist < bestDist) {
          bestDist = dist;
          bestDye = dye;
        }
      }
      if (bestDye && bestDye.id !== primary.dye.id) {
        chosen = { dye: bestDye, delta: deltaE2000(targetOklab, bestDye.oklab) };
      }
    }

    results.push(chosen);
    used.add(chosen.dye.id);
  }

  return results;
}

/**
 * dyeAとdyeBのOklab空間での中間点に最も近い染料を見つける
 * 2色の「橋渡し」となる色を選ぶ
 */
export function findBridgeDye(
  dyeA: DyeProps,
  dyeB: DyeProps,
  palette: DyeProps[]
): DyeProps | null {
  // Oklab空間での中間点を計算
  const [la, aa, ba] = dyeA.oklab.coords;
  const [lb, ab, bb] = dyeB.oklab.coords;
  const midpointOklab: Oklab = {
    space: 'oklab',
    coords: [(la + lb) / 2, (aa + ab) / 2, (ba + bb) / 2],
  };

  let minDistance = Infinity;
  let selectedDye: DyeProps | null = null;

  for (const dye of palette) {
    // dyeAまたはdyeBと同じ場合はスキップ
    if (dye.id === dyeA.id || dye.id === dyeB.id) continue;

    const distance = deltaE2000(dye.oklab, midpointOklab);

    if (distance < minDistance) {
      minDistance = distance;
      selectedDye = dye;
    }
  }

  // 適切な染料が見つからない場合はランダムに選択。プールが空なら null を返し、
  // 呼び出し側の縮退フォールバック（padToPair）に委ねる。
  if (!selectedDye) {
    const availableDyes = palette.filter((dye) => dye.id !== dyeA.id && dye.id !== dyeB.id);
    if (availableDyes.length === 0) return null;
    selectedDye = availableDyes[Math.floor(Math.random() * availableDyes.length)];
  }

  return selectedDye;
}

/**
 * 提案 dye が 2 色に満たない場合の縮退フォールバック。
 *
 * 方針: 「選出済み + 未使用染料で埋める → それでも足りなければ最後は primaryDye 自身で埋める」。
 * これにより空プール・痩せたプールでも無限ループ・undefined・重複を避けつつ、
 * `[DyeProps, DyeProps]` の戻り値契約（undefined を含まない）を必ず守る。
 */
function padToPair(
  chosen: (DyeProps | undefined)[],
  primaryDye: DyeProps,
  allDyes: DyeProps[]
): [DyeProps, DyeProps] {
  const result: DyeProps[] = [];
  const usedIds = new Set<string>();

  for (const dye of chosen) {
    if (result.length >= 2) break;
    if (dye && !usedIds.has(dye.id)) {
      result.push(dye);
      usedIds.add(dye.id);
    }
  }

  // 未使用染料（primary も除外）で埋める
  for (const dye of allDyes) {
    if (result.length >= 2) break;
    if (dye.id === primaryDye.id || usedIds.has(dye.id)) continue;
    result.push(dye);
    usedIds.add(dye.id);
  }

  // それでも足りなければ primaryDye 自身で埋める（クラッシュ防止の最終手段）
  while (result.length < 2) {
    result.push(primaryDye);
  }

  return [result[0], result[1]];
}

// ティント/シェード用のOKLCH明度オフセット
// L+/-OFFSET_NEAR と L+/-OFFSET_FAR で 2段階の明度バリエーションを作る
const TINT_SHADE_OFFSETS = { NEAR: 0.1, FAR: 0.18 } as const;
const OKLCH_L_MIN = 0.01;
const OKLCH_L_MAX = 0.99;

/**
 * ティント/シェード用のターゲット色2つをOKLCH明度操作で生成
 * @param primaryDye 主色
 * @param direction 'tint' で明色方向, 'shade' で暗色方向
 */
function generateTintShadeTargets(primaryDye: DyeProps, direction: 'tint' | 'shade'): Rgb[] {
  const baseOklch = toOklch(primaryDye.rgb);
  const [baseL, baseC, baseH] = baseOklch.coords;
  const sign = direction === 'tint' ? 1 : -1;
  const offsets = [TINT_SHADE_OFFSETS.NEAR, TINT_SHADE_OFFSETS.FAR];

  return offsets.map((offset) => {
    const targetL = Math.max(OKLCH_L_MIN, Math.min(OKLCH_L_MAX, baseL + sign * offset));
    const targetOklch: Oklch = {
      space: 'oklch',
      coords: [targetL, baseC, baseH ?? 0],
    };
    return toRgb(targetOklch);
  });
}

/**
 * メタリックタグの提案 dye を、最も色味が近い非メタリック dye に置き換える。
 * - 非メタリックスロットには一切触れない（計算ロジックは常に同じ全染料プールで動く前提）
 * - 最近傍探索は `findNearestDyesInOklab` を再利用
 * - 主色 / もう一方の非メタリック提案と重複しないよう、候補プールから事前に除外
 */
function swapMetallicSuggestions(
  suggested: [DyeProps, DyeProps],
  allDyes: DyeProps[],
  primaryDyeId: string
): [DyeProps, DyeProps] {
  const isMetallic = (d: DyeProps): boolean => d.tags?.includes('metallic') ?? false;
  if (!suggested.some(isMetallic)) return suggested;

  const reserved = new Set<string>([primaryDyeId]);
  for (const d of suggested) {
    if (!isMetallic(d)) reserved.add(d.id);
  }
  const nonMetallicPool = allDyes.filter((d) => !isMetallic(d) && !reserved.has(d.id));

  const metallicSlotIndices = suggested
    .map((d, i) => (isMetallic(d) ? i : -1))
    .filter((i) => i >= 0);
  const targets = metallicSlotIndices.map((i) => suggested[i].rgb);
  const replacements = findNearestDyesInOklab(targets, nonMetallicPool);

  const result = [...suggested] as [DyeProps, DyeProps];
  metallicSlotIndices.forEach((slotIdx, j) => {
    if (replacements[j]) result[slotIdx] = replacements[j].dye;
  });
  return result;
}

/**
 * 配色パターンに基づいて提案染料を生成
 *
 * 計算は常に全染料プール (`allDyes`) で行う。`excludeMetallic` が true のときのみ、
 * 結果のうちメタリックタグを持つ dye だけを「同じ色味の非メタリック」に置き換える。
 * これにより、メタリック除外のトグルで非メタリックスロットが意図せず変化することを防ぐ。
 */
export function generateSuggestedDyes(
  primaryDye: DyeProps,
  pattern: HarmonyPattern,
  allDyes: DyeProps[],
  _seed?: number,
  excludeMetallic = false
): [DyeProps, DyeProps] {
  const computed = computeSuggestedDyes(primaryDye, pattern, allDyes);
  return excludeMetallic ? swapMetallicSuggestions(computed, allDyes, primaryDye.id) : computed;
}

function computeSuggestedDyes(
  primaryDye: DyeProps,
  pattern: HarmonyPattern,
  allDyes: DyeProps[]
): [DyeProps, DyeProps] {
  if (pattern === 'monochromatic') {
    const chosen = selectMonochromaticDyes(primaryDye, allDyes, {
      diversifyByLightness: true,
    }).map((c) => c.dye);
    // selector は最大 numResults 件しか返さない（プールが痩せると 2 件未満になり得る）ため、
    // 無検査キャストはやめて padToPair で必ず 2 色に揃える。
    return padToPair(chosen, primaryDye, allDyes);
  }

  // ティント（淡色）/ シェード（暗色）: 主色の色相・彩度を保ち、明度を上下にずらした2色
  // 候補プールのカスタマイズ（色相±許容範囲、無彩色フォールバック等）は撤廃して
  // findNearestDyesInOklab の helmlab フォールバックに委ねる実験中。
  if (pattern === 'tint' || pattern === 'shade') {
    const availableDyes = allDyes.filter((d) => d.id !== primaryDye.id);
    const targets = generateTintShadeTargets(primaryDye, pattern);
    const nearestDyes = findNearestDyesInOklab(targets, availableDyes).map((c) => c.dye);

    // 2色に満たない場合（候補不足など）は padToPair で確実に補完（無限ループを避ける）
    return padToPair(nearestDyes, primaryDye, allDyes);
  }

  // クラッシュパターンの場合は新しいロジックを使用
  if (pattern === 'clash') {
    const availableDyes = allDyes.filter((dye) => dye.id !== primaryDye.id);

    // 1. Base色をOklchに変換
    const baseOklch = toOklch(primaryDye.rgb);
    const [baseL, baseC, baseH] = baseOklch.coords;

    // 2. 補色の色相を計算（色相 + 180度）
    const complementHue = ((baseH ?? 0) + COMPLEMENTARY) % HUE_CIRCLE_MAX;

    // 3. 明度を逆方向に調整
    // Base色が明るい（L > threshold）なら暗く、暗いなら明るく
    const adjustedL =
      baseL > CLASH_CONFIG.LIGHTNESS_THRESHOLD
        ? CLASH_CONFIG.TARGET_LIGHTNESS_DARK
        : CLASH_CONFIG.TARGET_LIGHTNESS_LIGHT;

    // 4. 彩度を逆方向に調整
    // Base色の彩度が高い（C > threshold）なら低く、低いなら高く
    const adjustedC =
      baseC > CLASH_CONFIG.CHROMA_THRESHOLD
        ? CLASH_CONFIG.TARGET_CHROMA_LOW
        : CLASH_CONFIG.TARGET_CHROMA_HIGH;

    // 5. 調整されたOklchから3色目のターゲット色を作成
    const thirdColorOklch: Oklch = {
      space: 'oklch',
      coords: [adjustedL, adjustedC, complementHue],
    };
    const thirdColorTarget = toRgb(thirdColorOklch);

    // 6. ターゲット色に最も近い染料を3色目として選択
    const thirdColorCandidate = findNearestDyesInOklab([thirdColorTarget], availableDyes)[0];

    if (!thirdColorCandidate) {
      // フォールバック: 適切な染料が見つからない場合（空プール含む）
      return padToPair(availableDyes.slice(0, 2), primaryDye, allDyes);
    }

    const thirdColor = thirdColorCandidate.dye;

    // 7. 2色目（橋渡し）: Base色と3色目Xの中間色
    const bridgeColor = findBridgeDye(primaryDye, thirdColor, availableDyes);

    // 橋渡し候補が見つからない（プールが痩せている）場合は縮退フォールバック
    if (!bridgeColor) {
      return padToPair([thirdColor], primaryDye, allDyes);
    }

    return [bridgeColor, thirdColor];
  }

  // その他のパターンは既存のロジックを使用
  let targetHues: [number, number];
  const baseOklch = primaryDye.oklch;
  const [primaryL, primaryC] = baseOklch.coords;
  const baseHue = baseOklch.coords[2] ?? 0;

  switch (pattern) {
    case 'triadic':
      targetHues = calculateTriadic(baseHue);
      break;
    case 'split-complementary':
      targetHues = calculateSplitComplementary(baseHue);
      break;
    case 'analogous':
      targetHues = calculateAnalogous(baseHue);
      break;
    case 'similar':
      targetHues = calculateSimilar(baseHue);
      break;
    case 'contrast':
      targetHues = calculateContrast(baseHue);
      break;
    default:
      targetHues = calculateTriadic(baseHue);
  }

  // ターゲット色相を持つRGB色を生成（明度・彩度は primary と同じに保つ）
  const targets = targetHues.map((h) => {
    const target: Oklch = { space: 'oklch', coords: [primaryL, primaryC, h] };
    return toRgb(target);
  });

  const nearestDyes = findNearestDyesInOklab(
    targets,
    allDyes.filter((dye) => dye.id !== primaryDye.id)
  ).map((c) => c.dye);

  // 2色に満たない場合は padToPair で確実に補完（有効候補が2未満でも無限ループしない）
  return padToPair(nearestDyes, primaryDye, allDyes);
}
