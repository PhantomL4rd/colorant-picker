/**
 * 色変換ユーティリティ
 *
 * colorjs.io の procedural API (colorjs.io/fn) を使用。
 * 色は { space: string, coords: [...] } 形式の plain object で扱う。
 */

import {
  ColorSpace,
  OKLab as OKLabSpace,
  OKLCH as OKLCHSpace,
  sRGB,
  deltaE,
  serialize,
  to as convert,
  toGamut,
} from 'colorjs.io/fn';
import type { Oklab, Oklch, Rgb } from '$lib/types';
import { HUE_CIRCLE_MAX, HUE_DIFFERENCE_MAX } from '$lib/constants/color';

// 使用する色空間を登録（HSV は廃止、内部は Oklab/Oklch + sRGB のみ）
ColorSpace.register(sRGB);
ColorSpace.register(OKLabSpace);
ColorSpace.register(OKLCHSpace);

// ===== 空間変換コンバータ =====

export function toRgb(color: Rgb | Oklab | Oklch): Rgb {
  return convert(color, 'srgb') as unknown as Rgb;
}

export function toOklch(color: Rgb | Oklab | Oklch): Oklch {
  return convert(color, 'oklch') as unknown as Oklch;
}

export function toOklab(color: Rgb | Oklab | Oklch): Oklab {
  return convert(color, 'oklab') as unknown as Oklab;
}

// ===== HEX変換 =====

/** colorjs.io Rgb から hex 文字列（"#RRGGBB"） */
export function rgbToHex(rgb: Rgb): string {
  return formatHex(rgb);
}

/** colorjs.io オブジェクトを "#RRGGBB" 形式で出力（gamut clamp 込み・大文字） */
export function formatHex(color: Rgb | Oklab | Oklch): string {
  const rgb = convert(color, 'srgb') as unknown as Rgb;
  const clamped = toGamut(rgb, { space: 'srgb' }) as unknown as Rgb;
  return serialize(clamped, { format: 'hex' }).toUpperCase();
}

// ===== 色差計算 =====

/** 2つの Oklab 色の色差を計算（deltaE Oklch ベース） */
export function deltaEOklab(c1: Oklab, c2: Oklab): number {
  return deltaE(c1, c2, 'OK');
}

/** 2つの Oklch 色の色差を計算 */
export function deltaEOklch(c1: Oklch, c2: Oklch): number {
  return deltaE(c1, c2, 'OK');
}

// ===== 無彩色（グレー）判定 =====

/**
 * OKLCH クロマがこの値以下なら無彩色寄り（グレー）とみなし、色相判定を免除する閾値。
 * 無彩色は colorjs.io が hue に null を返すため、色相距離をそのまま使うと 0°(赤) 扱いになる。
 * ベース側・候補側の双方でこの単一ソースを参照して対称に扱う。
 */
export const GRAY_CHROMA_THRESHOLD = 0.02;

// ===== Hue関連ユーティリティ =====

/** 2つの色相の差（0-180） */
export function hueDiff(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % HUE_CIRCLE_MAX;
  return diff > HUE_DIFFERENCE_MAX ? HUE_CIRCLE_MAX - diff : diff;
}
