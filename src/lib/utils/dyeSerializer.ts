/**
 * 染料シリアライズユーティリティ
 * DyePropsをStoredDye形式に変換する共通ロジック
 */

import type { DyeProps, StoredDye } from '$lib/types';
import { Dye } from '$lib/models/Dye';

/**
 * DyePropsをStoredDye形式に変換
 * Dyeインスタンスの場合はtoStorable()を使用、それ以外は手動変換
 */
export function dyeToStorable(dye: DyeProps): StoredDye {
  if (dye instanceof Dye) {
    return dye.toStorable();
  }
  // DyePropsの場合はrgbが0-1範囲なので0-255に変換が必要
  return {
    id: dye.id,
    name: dye.name,
    category: dye.category,
    rgb: {
      r: Math.round(dye.rgb.r * 255),
      g: Math.round(dye.rgb.g * 255),
      b: Math.round(dye.rgb.b * 255),
    },
    tags: dye.tags,
  };
}
