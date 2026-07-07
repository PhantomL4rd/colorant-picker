/**
 * 軸ラダー（近傍色探索）
 *
 * 1色を起点に、OKLCHの明度(L) / 彩度(C) / 色相(H) のいずれか1軸を動かして、
 * 各ステップで最も近いカララントを取り出す。
 * AxisExplorer UI で「明るさを変える」「鮮やかさを変える」「色味を変える」を縦に並べる用途。
 *
 * 他軸方向の差はしきい値で足切りする（同じ色味で明るさを変える、の "同じ色味" を担保するため）。
 * しきい値内に候補がいない段はスキップされ、ラダーは規定段数より短くなることがある。
 *
 * 並び順は実際の染料の OKLCH 値ベース:
 * - lightness: 染料の L 昇順（暗 → 明）
 * - chroma   : 染料の C 昇順（くすみ → 鮮やか）
 * - hue      : ベース色相からの最小角度差の昇順（近い色味 → 遠い色味）
 */

import { HUE_CIRCLE_MAX } from '$lib/constants/color';
import type { DyeProps, Oklch, Rgb } from '$lib/types';
import { GRAY_CHROMA_THRESHOLD, deltaE2000, toOklab, toRgb } from './colorConversion';

export type LadderAxis = 'lightness' | 'chroma' | 'hue';

// 既定のステップ数（生成するラダーの段数）
const DEFAULT_STEPS = 18;

// 軸ごとの探索範囲（OKLCH空間）
const LIGHTNESS_MIN = 0.05;
const LIGHTNESS_MAX = 0.95;
const CHROMA_MIN = 0.0;
const CHROMA_MAX = 0.35;

// 軸ごとの「他軸方向の許容差」（OKLCH空間）
// これを超える染料は候補から除外し、軸ラベルの意味（同じ色味で〜 など）に実態を合わせる
const LIGHTNESS_AXIS_CHROMA_TOL = 0.08;
const LIGHTNESS_AXIS_HUE_TOL_DEG = 25;
const CHROMA_AXIS_LIGHTNESS_TOL = 0.12;
const CHROMA_AXIS_HUE_TOL_DEG = 25;
const HUE_AXIS_LIGHTNESS_TOL = 0.12;
const HUE_AXIS_CHROMA_TOL = 0.08;

export interface LadderEntry {
  /** 並び順用のソートキー（軸ごとに意味が変わる、表示には使わない） */
  sortKey: number;
  /** その軸位置に最も近いカララント */
  dye: DyeProps;
  /** ベース色との同一判定（UIで強調表示するため） */
  isBase: boolean;
}

function nearestDyeByOklab(targetRgb: Rgb, pool: DyeProps[], used: Set<string>): DyeProps | null {
  const targetOklab = toOklab(targetRgb);
  let best: DyeProps | null = null;
  let bestDelta = Infinity;
  for (const dye of pool) {
    if (used.has(dye.id)) continue;
    const delta = deltaE2000(targetOklab, dye.oklab);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = dye;
    }
  }
  return best;
}

/** 2つの色相の最小角度差（0..180） */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % HUE_CIRCLE_MAX;
  return Math.min(diff, HUE_CIRCLE_MAX - diff);
}

/** 軸ごとの「他軸方向の差が許容内か」判定 */
function withinAxisTolerance(axis: LadderAxis, dyeOklch: Oklch, baseOklch: Oklch): boolean {
  const [baseL, baseC, baseHraw] = baseOklch.coords;
  const [dyeL, dyeC, dyeHraw] = dyeOklch.coords;
  const baseH = baseHraw ?? 0;
  const dyeH = dyeHraw ?? 0;
  // ベース・候補いずれかが無彩色なら色相距離は無意味（null→0°=赤 扱いになる）ため免除。
  // ベース側の baseIsGray と対称に候補側も判定する。
  const baseIsGray = baseC <= GRAY_CHROMA_THRESHOLD;
  const dyeIsGray = dyeC <= GRAY_CHROMA_THRESHOLD;
  const hueExempt = baseIsGray || dyeIsGray;

  if (axis === 'lightness') {
    if (Math.abs(dyeC - baseC) > LIGHTNESS_AXIS_CHROMA_TOL) return false;
    if (hueExempt) return true;
    return hueDistance(dyeH, baseH) <= LIGHTNESS_AXIS_HUE_TOL_DEG;
  }
  if (axis === 'chroma') {
    if (Math.abs(dyeL - baseL) > CHROMA_AXIS_LIGHTNESS_TOL) return false;
    if (hueExempt) return true;
    return hueDistance(dyeH, baseH) <= CHROMA_AXIS_HUE_TOL_DEG;
  }
  return (
    Math.abs(dyeL - baseL) <= HUE_AXIS_LIGHTNESS_TOL &&
    Math.abs(dyeC - baseC) <= HUE_AXIS_CHROMA_TOL
  );
}

/**
 * 軸ごとのラダー生成。
 * - axis='lightness': 色相(H)と彩度(C)を baseDye のまま固定、L を 0.05..0.95 で等分
 * - axis='chroma'  : 色相(H)と明度(L)を baseDye のまま固定、C を 0..0.35 で等分
 * - axis='hue'     : 明度(L)と彩度(C)を baseDye のまま固定、H を 0..360 で等分
 *
 * 重複染料は除外。並び順は実際の染料の OKLCH 値ベース（軸ごとに意味が変わる）。
 *
 * @param baseDye 起点の染料
 * @param allDyes 候補の染料リスト
 * @param axis   動かす軸
 * @param steps  生成段数（既定 18）
 */
export function generateLadder(
  baseDye: DyeProps,
  allDyes: DyeProps[],
  axis: LadderAxis,
  steps = DEFAULT_STEPS
): LadderEntry[] {
  if (allDyes.length === 0) return [];

  const baseOklch = baseDye.oklch;
  const [baseL, baseC, baseHraw] = baseOklch.coords;
  const baseH = baseHraw ?? 0;

  // 他軸方向の差が許容内の染料だけを候補に絞る（ベース染料は必ず含める）
  const pool = allDyes.filter((dye) => {
    if (dye.id === baseDye.id) return true;
    return withinAxisTolerance(axis, dye.oklch, baseOklch);
  });

  const used = new Set<string>();
  const entries: LadderEntry[] = [];

  for (let i = 0; i < steps; i++) {
    // steps===1 のとき i/(steps-1) は 0除算(NaN)になるため、単一段は起点(t=0)に固定する。
    // 直線軸(L/C)は端点を含めたいので i/(steps-1)、hue は円環なので i/steps で 1周を均等分割する
    // （i/(steps-1) だと i=0 と最終段がどちらも H=0 になり重複してしまう）。
    const tLinear = steps > 1 ? i / (steps - 1) : 0;
    const tHue = steps > 0 ? i / steps : 0;

    let targetL = baseL;
    let targetC = baseC;
    let targetH = baseH;

    if (axis === 'lightness') {
      targetL = LIGHTNESS_MIN + tLinear * (LIGHTNESS_MAX - LIGHTNESS_MIN);
    } else if (axis === 'chroma') {
      targetC = CHROMA_MIN + tLinear * (CHROMA_MAX - CHROMA_MIN);
    } else {
      // hue: 0..360 を steps 等分（最終段が 360=先頭と重ならないよう i/steps を使う）
      targetH = (tHue * HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX;
    }

    const targetOklch: Oklch = {
      space: 'oklch',
      coords: [targetL, targetC, targetH],
    };
    const targetRgb = toRgb(targetOklch);

    const best = nearestDyeByOklab(targetRgb, pool, used);
    if (best) {
      // 採用された染料の実 OKLCH を計算してソートキーに使う
      const [dyeL, dyeC, dyeHraw] = best.oklch.coords;
      let sortKey: number;
      if (axis === 'lightness') {
        sortKey = dyeL;
      } else if (axis === 'chroma') {
        sortKey = dyeC;
      } else {
        sortKey = hueDistance(dyeHraw ?? 0, baseH);
      }

      entries.push({
        sortKey,
        dye: best,
        isBase: best.id === baseDye.id,
      });
      used.add(best.id);
    }
  }

  // ソートキーの昇順に並べ替え
  entries.sort((a, b) => a.sortKey - b.sortKey);

  return entries;
}
