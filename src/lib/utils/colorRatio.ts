/**
 * 色差計算と比率定数
 *
 * Paletteクラスから使用される基本的なユーティリティ。
 */

import type { Rgb, Oklch } from '$lib/types';
import { toOklch, deltaEOklch } from './colorConversion';

// ===== 定数 =====

// ベースウェイト（黄金比 70:25:5を実現する比率）
export const BASE_WEIGHTS = {
  main: 1.0,
  sub: 0.357, // サブ (25/70)
  accent: 0.071, // アクセント (5/70)
} as const;

export const SUPPRESSION_FACTOR = 2.5; // 非線形補正の係数k

// ===== 色差計算 =====

/**
 * 2色間のOKLCH色差（deltaE）を計算
 */
export function calculateDeltaE(main: Rgb, other: Rgb): number {
  const mainOklch = toOklch(main) as Oklch;
  const otherOklch = toOklch(other) as Oklch;
  return deltaEOklch(mainOklch, otherOklch);
}
