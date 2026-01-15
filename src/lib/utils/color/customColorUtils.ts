/**
 * カスタムカラーユーティリティ
 *
 * culori型を直接使用。
 */

import type { CustomColor, DyeProps, ExtendedDye, Oklab, RGBColor255 } from '$lib/types';
import { ID_LIMITS, RGB_BOUNDS } from '$lib/constants/validation';
import { formatHex, toOklab } from './colorConversion';

/**
 * CustomColorをDyePropsライクオブジェクトに変換
 */
export function customColorToDye(customColor: CustomColor): DyeProps {
  return {
    id: `custom-${customColor.id}`,
    name: customColor.name,
    category: 'white', // カスタムカラーは仮にwhite系に分類
    hsv: customColor.hsv,
    rgb: customColor.rgb,
    hex: formatHex(customColor.rgb).toUpperCase(),
    oklab: toOklab(customColor.rgb) as Oklab,
    tags: ['custom'],
  };
}

/**
 * CustomColorをExtendedDyeに変換
 */
export function createCustomDye(customColor: CustomColor): ExtendedDye {
  return {
    ...customColorToDye(customColor),
    source: 'custom',
    customColor,
  };
}

/**
 * RGB値のバリデーション（0-255範囲）
 */
export function validateRgbInput(rgb: RGBColor255): boolean {
  return (
    Number.isInteger(rgb.r) &&
    rgb.r >= RGB_BOUNDS.MIN &&
    rgb.r <= RGB_BOUNDS.MAX &&
    Number.isInteger(rgb.g) &&
    rgb.g >= RGB_BOUNDS.MIN &&
    rgb.g <= RGB_BOUNDS.MAX &&
    Number.isInteger(rgb.b) &&
    rgb.b >= RGB_BOUNDS.MIN &&
    rgb.b <= RGB_BOUNDS.MAX
  );
}

/**
 * カスタムカラー名のバリデーション
 */
export function validateCustomColorName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: '名前を入力してください' };
  }

  if (trimmed.length > ID_LIMITS.MAX_COLOR_NAME_LENGTH) {
    return {
      valid: false,
      error: `名前は${ID_LIMITS.MAX_COLOR_NAME_LENGTH}文字以内で入力してください`,
    };
  }

  return { valid: true };
}

/**
 * RGB文字列パース（例: "120,85,45" または "120, 85, 45"）
 * @returns 0-255範囲のRGB値
 */
export function parseRgbString(input: string): RGBColor255 | null {
  try {
    const parts = input.split(',').map((part) => part.trim());

    if (parts.length !== 3) {
      return null;
    }

    const r = parseInt(parts[0], 10);
    const g = parseInt(parts[1], 10);
    const b = parseInt(parts[2], 10);

    const rgb: RGBColor255 = { r, g, b };

    return validateRgbInput(rgb) ? rgb : null;
  } catch {
    return null;
  }
}

/**
 * RGB値を文字列として表示（例: "120, 85, 45"）
 * @param rgb 0-255範囲のRGB値
 */
export function formatRgbDisplay(rgb: RGBColor255): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * DyePropsがカスタムカラーかどうかを判定
 */
export function isCustomDye(
  dye: DyeProps | ExtendedDye
): dye is ExtendedDye & { source: 'custom' } {
  return (dye as ExtendedDye).source === 'custom';
}

/**
 * ExtendedDyeからCustomColorを抽出
 */
export function extractCustomColor(dye: ExtendedDye): CustomColor | null {
  return isCustomDye(dye) ? dye.customColor || null : null;
}
