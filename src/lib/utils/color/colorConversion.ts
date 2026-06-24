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
  parse,
  serialize,
  to as convert,
  toGamut,
} from 'colorjs.io/fn';
import type { Oklab, Oklch, Rgb, RGBColor255 } from '$lib/types';
import { HUE_CIRCLE_MAX, HUE_DIFFERENCE_MAX, RGB_MAX } from '$lib/constants/color';

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

// ===== 0-255範囲との変換（保存・共有用） =====

/** 0-255範囲から colorjs.io Rgb に変換 */
export function rgb255ToRgb(rgb255: RGBColor255): Rgb {
  return {
    space: 'srgb',
    coords: [rgb255.r / RGB_MAX, rgb255.g / RGB_MAX, rgb255.b / RGB_MAX],
  };
}

/** colorjs.io Rgb から 0-255範囲に変換 */
export function rgbToRgb255(rgb: Rgb): RGBColor255 {
  const [r, g, b] = rgb.coords;
  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * RGB_MAX),
    g: Math.round(Math.max(0, Math.min(1, g)) * RGB_MAX),
    b: Math.round(Math.max(0, Math.min(1, b)) * RGB_MAX),
  };
}

// ===== HEX変換 =====

/** colorjs.io Rgb から hex 文字列（"#RRGGBB"） */
export function rgbToHex(rgb: Rgb): string {
  return formatHex(rgb);
}

/** hex 文字列から colorjs.io Rgb */
export function hexToRgb(hex: string): Rgb {
  const parsed = parse(hex);
  if (!parsed) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return convert(parsed, 'srgb') as unknown as Rgb;
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

// ===== Hue関連ユーティリティ =====

/** 2つの色相の差（0-180） */
export function hueDelta(h1: number, h2: number): number {
  let d = Math.abs(h1 - h2);
  if (d > HUE_DIFFERENCE_MAX) d = HUE_CIRCLE_MAX - d;
  return d;
}

/** 2つの色相の差（0-180） */
export function hueDiff(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % HUE_CIRCLE_MAX;
  return diff > HUE_DIFFERENCE_MAX ? HUE_CIRCLE_MAX - diff : diff;
}

// ===== sRGBクリップ処理 =====

/** Oklab 色を sRGB ガマット内にクリップ */
export function clipOklabColor(oklab: Oklab): Oklab {
  const rgb = convert(oklab, 'srgb') as unknown as Rgb;
  const clipped: Rgb = {
    space: 'srgb',
    coords: [
      Math.max(0, Math.min(1, rgb.coords[0])),
      Math.max(0, Math.min(1, rgb.coords[1])),
      Math.max(0, Math.min(1, rgb.coords[2])),
    ],
  };
  return convert(clipped, 'oklab') as unknown as Oklab;
}
