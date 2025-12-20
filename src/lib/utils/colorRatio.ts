/**
 * 色差計算と比率定数
 *
 * Paletteクラスから使用される基本的なユーティリティ。
 */

import type { RGBColor } from '$lib/types';
import { useMode, modeRgb, modeOklch, differenceEuclidean } from 'culori/fn';
import type { Oklch } from 'culori/fn';
import { rgbToOklch } from './colorConversion';

// 使用する色空間を登録
useMode(modeRgb);
useMode(modeOklch);

// ===== 定数 =====

// デフォルト比率（黄金比 70:25:5）
export const DEFAULT_RATIO = {
  main: 70,
  sub: 25,
  accent: 5,
} as const;

// ベースウェイト（70:25:5を実現する比率）
export const BASE_WEIGHTS = {
  main: 1.0,
  sub: 0.357, // サブ (25/70)
  accent: 0.071, // アクセント (5/70)
} as const;

export const SUPPRESSION_FACTOR = 2.5; // 非線形補正の係数k

// ===== 色差計算 =====

const deltaEFn = differenceEuclidean('oklch');

/**
 * 2色間のOKLCH色差（deltaE）を計算
 */
export function calculateDeltaE(main: RGBColor, other: RGBColor): number {
  const mainOklch = rgbToOklch(main);
  const otherOklch = rgbToOklch(other);

  const culoriMain: Oklch = { mode: 'oklch', l: mainOklch.L, c: mainOklch.C, h: mainOklch.h };
  const culoriOther: Oklch = { mode: 'oklch', l: otherOklch.L, c: otherOklch.C, h: otherOklch.h };

  return deltaEFn(culoriMain, culoriOther);
}
