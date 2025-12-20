import type {
  HSVColor,
  RGBColor,
  OklabColor,
  Dye,
  CustomColor,
  StoredDye,
  StoredCustomColor,
  OklchColor,
} from '$lib/types';

// culori Tree-shaking imports
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
import type { Rgb, Hsv, Oklch, Oklab } from 'culori/fn';

// 使用する色空間を登録
useMode(modeRgb);
useMode(modeHsv);
useMode(modeOklch);
useMode(modeOklab);

// コンバーター（キャッシュ）
const toRgb = converter('rgb');
const toHsv = converter('hsv');
const toOklch = converter('oklch');
const toOklab = converter('oklab');

// ===== culori型との相互変換 =====

export function toCuloriRgb(rgb: RGBColor): Rgb {
  return { mode: 'rgb', r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
}

export function fromCuloriRgb(color: Rgb): RGBColor {
  return {
    r: Math.round(Math.max(0, Math.min(1, color.r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, color.g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, color.b)) * 255),
  };
}

// ===== RGB ↔ HSV =====

export function rgbToHsv(rgb: RGBColor): HSVColor {
  const hsv = toHsv(toCuloriRgb(rgb)) as Hsv;
  return {
    h: Math.round(hsv.h ?? 0),
    s: Math.round((hsv.s ?? 0) * 100),
    v: Math.round((hsv.v ?? 0) * 100),
  };
}

export function hsvToRgb(hsv: HSVColor): RGBColor {
  const culoriHsv: Hsv = { mode: 'hsv', h: hsv.h, s: hsv.s / 100, v: hsv.v / 100 };
  return fromCuloriRgb(toRgb(culoriHsv) as Rgb);
}

// ===== RGB ↔ HEX =====

export function rgbToHex(rgb: RGBColor): string {
  return formatHex(toCuloriRgb(rgb)).toUpperCase();
}

export function hexToRgb(hex: string): RGBColor {
  const parsed = parse(hex);
  if (!parsed) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const rgb = toRgb(parsed) as Rgb;
  return fromCuloriRgb(rgb);
}

// ===== RGB ↔ OKLab =====

export function rgbToOklab(rgb: RGBColor): OklabColor {
  const oklab = toOklab(toCuloriRgb(rgb)) as Oklab;
  return { L: oklab.l, a: oklab.a, b: oklab.b };
}

export function oklabToRgb(oklab: OklabColor): RGBColor {
  const culoriOklab: Oklab = { mode: 'oklab', l: oklab.L, a: oklab.a, b: oklab.b };
  return fromCuloriRgb(toRgb(culoriOklab) as Rgb);
}

// ===== RGB ↔ OKLCH =====

export function rgbToOklch(rgb: RGBColor): OklchColor {
  const oklch = toOklch(toCuloriRgb(rgb)) as Oklch;
  return { L: oklch.l, C: oklch.c, h: oklch.h ?? 0 };
}

export function oklchToRgb(oklch: OklchColor): RGBColor {
  const culoriOklch: Oklch = { mode: 'oklch', l: oklch.L, c: oklch.C, h: oklch.h };
  return fromCuloriRgb(toRgb(culoriOklch) as Rgb);
}

// ===== OKLab ↔ OKLCH =====

export function oklabToOklch(lab: OklabColor): OklchColor {
  const culoriOklab: Oklab = { mode: 'oklab', l: lab.L, a: lab.a, b: lab.b };
  const oklch = toOklch(culoriOklab) as Oklch;
  return { L: oklch.l, C: oklch.c, h: oklch.h ?? 0 };
}

export function oklchToOklab(lch: OklchColor): OklabColor {
  const culoriOklch: Oklch = { mode: 'oklch', l: lch.L, c: lch.C, h: lch.h };
  const oklab = toOklab(culoriOklch) as Oklab;
  return { L: oklab.l, a: oklab.a, b: oklab.b };
}

// ===== 色差計算 =====

const deltaEOklchFn = differenceEuclidean('oklch');

export function deltaEOklab(c1: OklabColor, c2: OklabColor): number {
  const oklch1: Oklch = { mode: 'oklch', ...oklabToOklch(c1), l: c1.L, c: oklabToOklch(c1).C, h: oklabToOklch(c1).h };
  const oklch2: Oklch = { mode: 'oklch', ...oklabToOklch(c2), l: c2.L, c: oklabToOklch(c2).C, h: oklabToOklch(c2).h };
  return deltaEOklchFn(oklch1, oklch2);
}

export function deltaEOklch(c1: OklchColor, c2: OklchColor): number {
  const oklch1: Oklch = { mode: 'oklch', l: c1.L, c: c1.C, h: c1.h };
  const oklch2: Oklch = { mode: 'oklch', l: c2.L, c: c2.C, h: c2.h };
  return deltaEOklchFn(oklch1, oklch2);
}

// ===== Hue関連ユーティリティ =====

export function hueDelta(h1: number, h2: number): number {
  let d = Math.abs(h1 - h2);
  if (d > 180) d = 360 - d;
  return d;
}

export function hueDiff(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// ===== sRGBクリップ処理 =====

export function clipOklabColor(oklab: OklabColor): OklabColor {
  const rgb = oklabToRgb(oklab);
  return rgbToOklab(rgb);
}

// ===== ハイドレーション =====

export function hydrateDye(stored: StoredDye | Dye): Dye {
  return {
    ...stored,
    hsv: rgbToHsv(stored.rgb),
    hex: rgbToHex(stored.rgb),
    oklab: rgbToOklab(stored.rgb),
  };
}

export function hydrateCustomColor(stored: StoredCustomColor | CustomColor): CustomColor {
  return {
    ...stored,
    hsv: rgbToHsv(stored.rgb),
  };
}

export function extractStoredDye(dye: Dye): StoredDye {
  const { hsv, hex, oklab, ...stored } = dye;
  return stored;
}

export function extractStoredCustomColor(color: CustomColor): StoredCustomColor {
  const { hsv, ...stored } = color;
  return stored;
}
