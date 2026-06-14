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
// 主候補の hue distance がこの値以下なら「in-hue」と判定し、フォールバックを発動しない。
// 30°（analogous レンジ相当）だと「31° で 1° だけ外れた」borderline ケースで
// 不必要にチロマ過剰な代替候補に置き換わる問題があるため、余裕を持って 45° に設定。
const HUE_FALLBACK_TOLERANCE_DEG = 45;
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

// ティント/シェードは「主色の色相を保ったまま明度違いを並べる」ことが目的。
// findNearestDyesInOklab の chroma ガードは target chroma >= CHROMATIC_TARGET_THRESHOLD (0.06)
// のときだけ発動するため、主色が低彩度（例: Currant Purple, oklab chroma ≈ 0.028）の場合
// 明度だけが近い無彩色（Slate Grey 等）や色相違いの染料（Gloom Purple のシェードで Midnight Blue
// が出る等）が最近傍に選ばれて色味/色相が崩れる。主色が「色付き」と言える彩度を持っているときは、
// 主色の色相から大きく外れた染料と、近接色相でない無彩色寄りの染料を候補から除外する。
// 主色自体が grey 系のときはフィルタを掛けない（grey の tint/shade は同系統 grey が望ましい）。
const TINT_SHADE_PRIMARY_CHROMA_THRESHOLD = 0.02;
// hue が ±HUE_TOL_DEG を超えたら別色扱いで除外。
// ±HUE_TIGHT_DEG 以内なら同系色とみなし chroma を問わず採用（Dark Purple のような
// 「主色と同じ hue の暗バージョン」を shade 候補として確保するため）。
// それ以外（HUE_TIGHT 〜 HUE_TOL の範囲）は chroma >= MIN_DYE_CHROMA を要求して
// 無彩色寄りの染料を弾く。
const TINT_SHADE_HUE_TOL_DEG = 22;
const TINT_SHADE_HUE_TIGHT_DEG = 15;
const TINT_SHADE_MIN_DYE_CHROMA = 0.025;
// 「色味のあるカララントの極端な tint は white、shade は black に寄っても自然」という直感を
// 満たすため、無彩色（chroma < ACHROMATIC_CHROMA）の染料は明度が極端なものだけ pool に許す。
// 中間明度の grey（Slate Grey 等）が低彩度主色のティント候補に紛れ込むのは引き続き防ぐ。
const TINT_SHADE_ACHROMATIC_CHROMA = 0.025;
const TINT_SHADE_LIGHT_ACHROMATIC_L = 0.85;
const TINT_SHADE_DARK_ACHROMATIC_L = 0.3;

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

/**
 * メタリックタグの提案 dye を、最も色味が近い非メタリック dye に置き換える。
 * - 非メタリックスロットには一切触れない（計算ロジックは常に同じ全染料プールで動く前提）
 * - 最近傍探索は `findNearestDyesInOklab` を再利用（chroma ガード等の挙動が共通になる）
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
    return selectMonochromaticDyes(primaryDye, allDyes, { diversifyByLightness: true }).map(
      (c) => c.dye
    ) as [DyeProps, DyeProps];
  }

  // ティント（淡色）/ シェード（暗色）: 主色の色相・彩度を保ち、明度を上下にずらした2色
  if (pattern === 'tint' || pattern === 'shade') {
    const primaryChroma = oklabChroma(primaryDye.oklab);
    const primaryHue = oklabHue(primaryDye.oklab);
    const enforceHue =
      primaryChroma >= TINT_SHADE_PRIMARY_CHROMA_THRESHOLD && primaryHue !== undefined;
    const isTint = pattern === 'tint';
    const availableDyes = allDyes.filter((d) => {
      if (d.id === primaryDye.id) return false;
      if (!enforceHue) return true;
      const dyeHue = oklabHue(d.oklab);
      const dyeChroma = oklabChroma(d.oklab);
      const hueGap = hueDistance(primaryHue, dyeHue);
      if (hueGap <= TINT_SHADE_HUE_TIGHT_DEG) return true;
      if (hueGap <= TINT_SHADE_HUE_TOL_DEG && dyeChroma >= TINT_SHADE_MIN_DYE_CHROMA) return true;
      // 無彩色寄りの染料は「ティントなら極端に明るい white 系」「シェードなら極端に暗い black 系」
      // だけ pool に許す。中間明度の grey は引き続き除外して色味の喪失を防ぐ。
      if (dyeChroma < TINT_SHADE_ACHROMATIC_CHROMA) {
        if (isTint && d.oklab.l >= TINT_SHADE_LIGHT_ACHROMATIC_L) return true;
        if (!isTint && d.oklab.l <= TINT_SHADE_DARK_ACHROMATIC_L) return true;
      }
      return false;
    });
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
