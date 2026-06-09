/**
 * 軸ラダー（近傍色探索）
 *
 * 1色を起点に、OKLCHの明度(L) / 彩度(C) / 色相(H) のいずれか1軸を動かして、
 * 各ステップで最も近いカララントを取り出す。
 * AxisExplorer UI で「同じ色味のまま明るい〜暗い」「同じ明るさで鮮やか〜くすませ」
 * 「同じ明るさで色味ちがい」を縦に並べて見せる用途。
 *
 * 並び順は実際の染料の OKLCH 値ベース:
 * - lightness: 染料の L 昇順（暗 → 明）
 * - chroma   : 染料の C 昇順（くすみ → 鮮やか）
 * - hue      : ベース色相からの最小角度差の昇順（近い色味 → 遠い色味）
 */

import type { DyeProps, Oklab, Oklch, Rgb } from '$lib/types';
import { HUE_CIRCLE_MAX } from '$lib/constants/color';
import { deltaEOklab, toOklab, toOklch, toRgb } from './colorConversion';

export type LadderAxis = 'lightness' | 'chroma' | 'hue';

// 既定のステップ数（生成するラダーの段数）
const DEFAULT_STEPS = 18;

// 軸ごとの探索範囲（OKLCH空間）
const LIGHTNESS_MIN = 0.05;
const LIGHTNESS_MAX = 0.95;
const CHROMA_MIN = 0.0;
const CHROMA_MAX = 0.35;

export interface LadderEntry {
  /** 並び順用のソートキー（軸ごとに意味が変わる、表示には使わない） */
  sortKey: number;
  /** その軸位置に最も近いカララント */
  dye: DyeProps;
  /** ベース色との同一判定（UIで強調表示するため） */
  isBase: boolean;
}

function nearestDyeByOklab(targetRgb: Rgb, pool: DyeProps[], used: Set<string>): DyeProps | null {
  const targetOklab = toOklab(targetRgb) as Oklab;
  let best: DyeProps | null = null;
  let bestDelta = Infinity;
  for (const dye of pool) {
    if (used.has(dye.id)) continue;
    const delta = deltaEOklab(targetOklab, dye.oklab);
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

  const baseOklch = toOklch(baseDye.rgb) as Oklch;
  const baseH = baseOklch.h ?? 0;

  const used = new Set<string>();
  const entries: LadderEntry[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);

    let targetL = baseOklch.l;
    let targetC = baseOklch.c;
    let targetH = baseH;

    if (axis === 'lightness') {
      targetL = LIGHTNESS_MIN + t * (LIGHTNESS_MAX - LIGHTNESS_MIN);
    } else if (axis === 'chroma') {
      targetC = CHROMA_MIN + t * (CHROMA_MAX - CHROMA_MIN);
    } else {
      // hue: 0..360 を等分（最終ステップが 360 になると先頭と重なるので等間隔のまま）
      targetH = (t * HUE_CIRCLE_MAX) % HUE_CIRCLE_MAX;
    }

    const targetOklch: Oklch = {
      mode: 'oklch',
      l: targetL,
      c: targetC,
      h: targetH,
    };
    const targetRgb = toRgb(targetOklch) as Rgb;

    const best = nearestDyeByOklab(targetRgb, allDyes, used);
    if (best) {
      // 採用された染料の実 OKLCH を計算してソートキーに使う
      const dyeOklch = toOklch(best.rgb) as Oklch;
      let sortKey: number;
      if (axis === 'lightness') {
        sortKey = dyeOklch.l;
      } else if (axis === 'chroma') {
        sortKey = dyeOklch.c;
      } else {
        sortKey = hueDistance(dyeOklch.h ?? 0, baseH);
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
