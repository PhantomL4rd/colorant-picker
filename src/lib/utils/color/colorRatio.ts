/**
 * 色差計算と比率定数
 *
 * Paletteクラスから使用される基本的なユーティリティ。
 */

import type { Oklab, Rgb } from '$lib/types';
import { deltaEOklab, toOklab } from './colorConversion';

// ===== 定数 =====

// ベースウェイト（黄金比 70:25:5を実現する比率）
export const BASE_WEIGHTS = {
  main: 1.0,
  sub: 0.357, // サブ (25/70)
  accent: 0.071, // アクセント (5/70)
} as const;

// 非線形補正の係数 k。deltaE の値域 (OKLab Euclidean 0〜0.5 程度) に合わせて調整済み。
// deltaE の指標を差し替える場合は必ずこの係数も再チューニングすること
// （さもないと exp(-k * ΔE) の値が飽和して sub/accent の比率が 0 に潰れる）。
export const SUPPRESSION_FACTOR = 2.5;

// ===== 色差計算 =====

/**
 * 2色間の OKLab Euclidean 色差を計算（比率計算専用）。
 *
 * 「近さ」を問う用途では deltaE2000 の方が精度は良いが、SUPPRESSION_FACTOR がこのスケールに
 * 合わせてチューニング済みなので、比率計算 (`Palette.ratio`) はこの指標を維持する。
 */
export function calculateDeltaE(main: Rgb, other: Rgb): number {
  const mainOklab = toOklab(main) as Oklab;
  const otherOklab = toOklab(other) as Oklab;
  return deltaEOklab(mainOklab, otherOklab);
}
