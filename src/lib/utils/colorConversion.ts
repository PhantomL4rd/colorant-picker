/**
 * 色変換ユーティリティ
 *
 * culori型を直接使用。0-255範囲との変換は保存・共有時のみ必要。
 */

import type { RGBColor255 } from '$lib/types';
import {
  useMode,
  modeRgb,
  modeHsv,
  modeOklch,
  modeOklab,
  converter,
  formatHex,
  parse,
  differenceEuclidean,
} from 'culori/fn';
import type { Rgb, Oklch, Oklab } from 'culori/fn';

// 使用する色空間を登録
useMode(modeRgb);
useMode(modeHsv);
useMode(modeOklch);
useMode(modeOklab);

// コンバーター（キャッシュ）
export const toRgb = converter('rgb');
export const toHsv = converter('hsv');
export const toOklch = converter('oklch');
export const toOklab = converter('oklab');

// culoriユーティリティの再エクスポート
export { formatHex };

// ===== 0-255範囲との変換（保存・共有用） =====

/** 0-255範囲からculori Rgbに変換 */
export function rgb255ToRgb(rgb255: RGBColor255): Rgb {
  return { mode: 'rgb', r: rgb255.r / 255, g: rgb255.g / 255, b: rgb255.b / 255 };
}

/** culori Rgbから0-255範囲に変換 */
export function rgbToRgb255(rgb: Rgb): RGBColor255 {
  return {
    r: Math.round(Math.max(0, Math.min(1, rgb.r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, rgb.g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, rgb.b)) * 255),
  };
}

// ===== HEX変換 =====

/** culori Rgbからhex文字列 */
export function rgbToHex(rgb: Rgb): string {
  return formatHex(rgb).toUpperCase();
}

/** hex文字列からculori Rgb */
export function hexToRgb(hex: string): Rgb {
  const parsed = parse(hex);
  if (!parsed) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return toRgb(parsed) as Rgb;
}

// ===== 色差計算 =====

const deltaEOklchFn = differenceEuclidean('oklch');

/** 2つのOklab色の色差を計算 */
export function deltaEOklab(c1: Oklab, c2: Oklab): number {
  const oklch1 = toOklch(c1) as Oklch;
  const oklch2 = toOklch(c2) as Oklch;
  return deltaEOklchFn(oklch1, oklch2);
}

/** 2つのOklch色の色差を計算 */
export function deltaEOklch(c1: Oklch, c2: Oklch): number {
  return deltaEOklchFn(c1, c2);
}

// ===== Hue関連ユーティリティ =====

/** 2つの色相の差（0-180） */
export function hueDelta(h1: number, h2: number): number {
  let d = Math.abs(h1 - h2);
  if (d > 180) d = 360 - d;
  return d;
}

/** 2つの色相の差（0-180） */
export function hueDiff(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// ===== sRGBクリップ処理 =====

/** Oklab色をsRGB範囲にクリップ */
export function clipOklabColor(oklab: Oklab): Oklab {
  const rgb = toRgb(oklab) as Rgb;
  const clipped: Rgb = {
    mode: 'rgb',
    r: Math.max(0, Math.min(1, rgb.r)),
    g: Math.max(0, Math.min(1, rgb.g)),
    b: Math.max(0, Math.min(1, rgb.b)),
  };
  return toOklab(clipped) as Oklab;
}
