/**
 * 色調和アルゴリズム
 *
 * culori型を直接使用。
 */

import type { DyeCandidate, DyeProps, HarmonyPattern, Hsv, Oklab, Oklch, Rgb } from '$lib/types';
import { CLASH_CONFIG, HARMONY_ANGLES, HUE_CIRCLE_MAX } from '$lib/constants/color';
import { deltaEOklab, toOklab, toOklch, toRgb } from './colorConversion';
import { selectMonochromaticDyes } from './selector/monochromatic';

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

// クラッシュ - 補色±30°（挑戦的な配色）
export function calculateClash(baseHue: number): [number, number] {
  const complement = (baseHue + COMPLEMENTARY) % HUE_CIRCLE_MAX;
  return [
    (complement - SPLIT_COMPLEMENTARY_ADJUSTMENT + HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX,
    (complement + SPLIT_COMPLEMENTARY_ADJUSTMENT) % HUE_CIRCLE_MAX,
  ];
}

// 最も近い色相の染料を見つける
export function findNearestDyes(
  targetHues: number[],
  dyes: DyeProps[],
  excludeDye?: DyeProps
): DyeProps[] {
  const availableDyes = dyes.filter((dye) => !excludeDye || dye.id !== excludeDye.id);
  const result: DyeProps[] = [];
  const usedDyeIds = new Set<string>();

  for (const targetHue of targetHues) {
    let closestDye: DyeProps | null = null;
    let minDifference = Infinity;

    for (const dye of availableDyes) {
      // すでに結果として選ばれている染料はスキップする
      if (usedDyeIds.has(dye.id)) continue;

      const dyeHue = dye.hsv.h ?? 0;
      const hueDifference = Math.min(
        Math.abs(dyeHue - targetHue),
        HUE_CIRCLE_MAX - Math.abs(dyeHue - targetHue)
      );

      if (hueDifference < minDifference) {
        minDifference = hueDifference;
        closestDye = dye;
      }
    }

    if (closestDye) {
      result.push(closestDye);
      // 見つかった染料のIDを記録し、次の検索で重複しないようにする
      usedDyeIds.add(closestDye.id);
    }
  }

  return result;
}

// ターゲットが彩度を持つときに「明度だけ近いグレー寄り染料」が選ばれるのを防ぐための閾値。
// ターゲット chroma がこの値以上なら、染料 chroma が target * CHROMA_RATIO_MIN 未満の染料を候補から除外する。
// scripts/sync-traditional-color-dyes.mjs と同じ思想（係数値は揃えている）。
const CHROMATIC_TARGET_THRESHOLD = 0.06;
const CHROMA_RATIO_MIN = 0.4;

// 色相フォールバック: 主候補の deltaE が大きく、ターゲットが有彩色なら、
// 色相が近い候補のうち「主候補との deltaE 差が許容範囲内」のものに切り替える。
// scripts/sync-traditional-color-dyes.mjs の同名ロジックと思想を揃えているが、
// 通常配色は伝統色再現より色相寛容なので HUE_TOLERANCE_DEG を広めに取っている。
const HUE_FALLBACK_DELTA_THRESHOLD = 0.08;
const HUE_FALLBACK_TOLERANCE_DEG = 30;
const HUE_FALLBACK_MIN_TARGET_CHROMA = 0.04;
const HUE_FALLBACK_MAX_EXCESS = 0.05;
const ACHROMATIC_EPSILON = 1e-6;

function oklabChroma(oklab: Oklab): number {
  return Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
}

function oklabHue(oklab: Oklab): number | undefined {
  if (oklab.a * oklab.a + oklab.b * oklab.b < ACHROMATIC_EPSILON) return undefined;
  return ((Math.atan2(oklab.b, oklab.a) * 180) / Math.PI + 360) % 360;
}

function hueDistance(a: number | undefined, b: number | undefined): number {
  if (a == null || b == null) return Number.POSITIVE_INFINITY;
  const d = Math.abs(a - b) % HUE_CIRCLE_MAX;
  return d > HUE_CIRCLE_MAX / 2 ? HUE_CIRCLE_MAX - d : d;
}

/**
 * Find the nearest dyes for each targets in a palette based on color difference in Oklab space.
 *
 * - chroma ガード: ターゲットが有彩色（chroma >= CHROMATIC_TARGET_THRESHOLD）の場合、
 *   著しく彩度が落ちた染料を候補から除外して「グレー寄り染料の混入で配色が濁る」のを防ぐ。
 * - 色相フォールバック: pick 時に「主候補の deltaE が大きく、ターゲットが有彩色」なら
 *   色相が近い許容範囲内の代替候補へ切り替える。dedup で 2 番手以降に色相意図破綻が
 *   起こるケース（例: Rose Pink contrast で Cream Yellow が選ばれる）を防ぐ。
 */
export function findNearestDyesInOklab(targets: Rgb[], palette: DyeProps[]): DyeCandidate[] {
  const perTarget = targets.map((target) => {
    const targetOklab = toOklab(target) as Oklab;
    const targetChroma = oklabChroma(targetOklab);
    const targetHue = oklabHue(targetOklab);
    const pool =
      targetChroma >= CHROMATIC_TARGET_THRESHOLD
        ? (() => {
            const minDyeChroma = targetChroma * CHROMA_RATIO_MIN;
            const filtered = palette.filter((dye) => oklabChroma(dye.oklab) >= minDyeChroma);
            return filtered.length > 0 ? filtered : palette;
          })()
        : palette;
    const candidates: DyeCandidate[] = pool
      .map((dye) => ({ dye, delta: deltaEOklab(targetOklab, dye.oklab) }))
      .sort((a, b) => a.delta - b.delta);
    return { targetChroma, targetHue, candidates };
  });

  const results: DyeCandidate[] = [];
  const used = new Set<string>();
  for (const { targetChroma, targetHue, candidates } of perTarget) {
    const primary = candidates.find((c) => !used.has(c.dye.id));
    if (!primary) continue;

    let chosen = primary;
    if (
      targetChroma >= HUE_FALLBACK_MIN_TARGET_CHROMA &&
      primary.delta > HUE_FALLBACK_DELTA_THRESHOLD
    ) {
      // candidates は delta 昇順なので、excess を超えた時点で打ち切れる。
      // 主候補自身が in-hue ならそのまま採用されて即終了。
      for (const c of candidates) {
        if (used.has(c.dye.id)) continue;
        if (c.delta - primary.delta > HUE_FALLBACK_MAX_EXCESS) break;
        if (hueDistance(targetHue, oklabHue(c.dye.oklab)) <= HUE_FALLBACK_TOLERANCE_DEG) {
          chosen = c;
          break;
        }
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
export function findBridgeDye(dyeA: DyeProps, dyeB: DyeProps, palette: DyeProps[]): DyeProps {
  // Oklab空間での中間点を計算
  const midpointOklab: Oklab = {
    mode: 'oklab',
    l: (dyeA.oklab.l + dyeB.oklab.l) / 2,
    a: (dyeA.oklab.a + dyeB.oklab.a) / 2,
    b: (dyeA.oklab.b + dyeB.oklab.b) / 2,
  };

  let minDistance = Infinity;
  let selectedDye: DyeProps | null = null;

  for (const dye of palette) {
    // dyeAまたはdyeBと同じ場合はスキップ
    if (dye.id === dyeA.id || dye.id === dyeB.id) continue;

    const distance = deltaEOklab(dye.oklab, midpointOklab);

    if (distance < minDistance) {
      minDistance = distance;
      selectedDye = dye;
    }
  }

  // 適切な染料が見つからない場合はランダムに選択
  if (!selectedDye) {
    const availableDyes = palette.filter((dye) => dye.id !== dyeA.id && dye.id !== dyeB.id);
    selectedDye = availableDyes[Math.floor(Math.random() * availableDyes.length)];
  }

  return selectedDye;
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
  const baseOklch = toOklch(primaryDye.rgb) as Oklch;
  const sign = direction === 'tint' ? 1 : -1;
  const offsets = [TINT_SHADE_OFFSETS.NEAR, TINT_SHADE_OFFSETS.FAR];

  return offsets.map((offset) => {
    const targetL = Math.max(OKLCH_L_MIN, Math.min(OKLCH_L_MAX, baseOklch.l + sign * offset));
    const targetOklch: Oklch = {
      mode: 'oklch',
      l: targetL,
      c: baseOklch.c,
      h: baseOklch.h ?? 0,
    };
    return toRgb(targetOklch) as Rgb;
  });
}

// 配色パターンに基づいて提案染料を生成
export function generateSuggestedDyes(
  primaryDye: DyeProps,
  pattern: HarmonyPattern,
  allDyes: DyeProps[],
  _seed?: number
): [DyeProps, DyeProps] {
  if (pattern === 'monochromatic') {
    return selectMonochromaticDyes(primaryDye, allDyes, { diversifyByLightness: true }).map(
      (c) => c.dye
    ) as [DyeProps, DyeProps];
  }

  // ティント（淡色）/ シェード（暗色）: 主色の色相・彩度を保ち、明度を上下にずらした2色
  if (pattern === 'tint' || pattern === 'shade') {
    const availableDyes = allDyes.filter((d) => d.id !== primaryDye.id);
    const targets = generateTintShadeTargets(primaryDye, pattern);
    const nearestDyes = findNearestDyesInOklab(targets, availableDyes).map((c) => c.dye);

    // 2色に満たない場合（候補不足など）はランダムで補完
    while (nearestDyes.length < 2 && availableDyes.length > 0) {
      const randomDye = availableDyes[Math.floor(Math.random() * availableDyes.length)];
      if (!nearestDyes.some((d) => d.id === randomDye.id)) {
        nearestDyes.push(randomDye);
      }
    }

    return [nearestDyes[0], nearestDyes[1]] as [DyeProps, DyeProps];
  }

  // クラッシュパターンの場合は新しいロジックを使用
  if (pattern === 'clash') {
    const availableDyes = allDyes.filter((dye) => dye.id !== primaryDye.id);

    // 1. Base色をOklchに変換
    const baseOklch = toOklch(primaryDye.rgb) as Oklch;

    // 2. 補色の色相を計算（色相 + 180度）
    const complementHue = ((baseOklch.h ?? 0) + COMPLEMENTARY) % HUE_CIRCLE_MAX;

    // 3. 明度を逆方向に調整
    // Base色が明るい（L > threshold）なら暗く、暗いなら明るく
    const adjustedL =
      baseOklch.l > CLASH_CONFIG.LIGHTNESS_THRESHOLD
        ? CLASH_CONFIG.TARGET_LIGHTNESS_DARK
        : CLASH_CONFIG.TARGET_LIGHTNESS_LIGHT;

    // 4. 彩度を逆方向に調整
    // Base色の彩度が高い（C > threshold）なら低く、低いなら高く
    const adjustedC =
      baseOklch.c > CLASH_CONFIG.CHROMA_THRESHOLD
        ? CLASH_CONFIG.TARGET_CHROMA_LOW
        : CLASH_CONFIG.TARGET_CHROMA_HIGH;

    // 5. 調整されたOklchから3色目のターゲット色を作成
    const thirdColorOklch: Oklch = { mode: 'oklch', l: adjustedL, c: adjustedC, h: complementHue };
    const thirdColorTarget = toRgb(thirdColorOklch) as Rgb;

    // 6. ターゲット色に最も近い染料を3色目として選択
    const thirdColorCandidate = findNearestDyesInOklab([thirdColorTarget], availableDyes)[0];

    if (!thirdColorCandidate) {
      // フォールバック: 適切な染料が見つからない場合
      const randomDyes = availableDyes.slice(0, 2);
      return [randomDyes[0], randomDyes[1]] as [DyeProps, DyeProps];
    }

    const thirdColor = thirdColorCandidate.dye;

    // 7. 2色目（橋渡し）: Base色と3色目Xの中間色
    const bridgeColor = findBridgeDye(primaryDye, thirdColor, availableDyes);

    return [bridgeColor, thirdColor];
  }

  // その他のパターンは既存のロジックを使用
  let targetHues: [number, number];
  const baseHue = primaryDye.hsv.h ?? 0;

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

  // ターゲット色相を持つRGB色を生成
  const primaryHsv = primaryDye.hsv;
  const targets = targetHues.map((h) => {
    const hsv: Hsv = { mode: 'hsv', h, s: primaryHsv.s ?? 0, v: primaryHsv.v ?? 0 };
    return toRgb(hsv) as Rgb;
  });

  const nearestDyes = findNearestDyesInOklab(
    targets,
    allDyes.filter((dye) => dye.id !== primaryDye.id)
  ).map((c) => c.dye);

  // 2色に満たない場合はランダムで補完
  while (nearestDyes.length < 2) {
    const randomDye = allDyes[Math.floor(Math.random() * allDyes.length)];
    if (!nearestDyes.includes(randomDye) && randomDye.id !== primaryDye.id) {
      nearestDyes.push(randomDye);
    }
  }

  return [nearestDyes[0], nearestDyes[1]];
}
