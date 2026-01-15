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

/**
 * Find the nearest dyes for each targets in a palette based on color difference in Oklab space.
 */
export function findNearestDyesInOklab(targets: Rgb[], palette: DyeProps[]): DyeCandidate[] {
  const candidatesByTarget = targets.map((target) => {
    const targetOklab = toOklab(target) as Oklab;
    const candidates: DyeCandidate[] = palette.map((dye) => ({
      dye,
      delta: deltaEOklab(targetOklab, dye.oklab),
    }));
    return candidates.sort((a, b) => a.delta - b.delta);
  });

  const results: DyeCandidate[] = [];
  const used = new Set<string>();
  for (const candidates of candidatesByTarget) {
    const candidate = candidates.find((c) => !used.has(c.dye.id));
    if (candidate) {
      results.push(candidate);
      used.add(candidate.dye.id);
    }
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
