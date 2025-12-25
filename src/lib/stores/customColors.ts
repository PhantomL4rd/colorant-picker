/**
 * カスタムカラーストア
 * ユーザー定義カラーの管理（LocalStorage永続化）
 */

import { get } from 'svelte/store';
import type { CustomColor, Hsv, RGBColor255, StoredCustomColor } from '$lib/types';
import { rgb255ToRgb, toHsv } from '$lib/utils/colorConversion';
import { createPersistentStore } from '$lib/utils/persistentStore';
import { generateId } from '$lib/utils/uuid';

// ===== 定数 =====

const STORAGE_KEY = 'colorant-picker:custom-colors';
const STORAGE_VERSION = '1.0.0';

// ===== 永続化ストア =====

const customColorsPersistence = createPersistentStore<CustomColor, StoredCustomColor>({
  key: STORAGE_KEY,
  version: STORAGE_VERSION,
  toStorable: (color) => ({
    id: color.id,
    name: color.name,
    rgb: {
      r: Math.round(color.rgb.r * 255),
      g: Math.round(color.rgb.g * 255),
      b: Math.round(color.rgb.b * 255),
    },
    createdAt: color.createdAt,
    updatedAt: color.updatedAt,
  }),
  fromStorable: (stored) => {
    const rgb = rgb255ToRgb(stored.rgb);
    return {
      id: stored.id,
      name: stored.name,
      rgb,
      hsv: toHsv(rgb) as Hsv,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    };
  },
  validate: (stored) => {
    return !!(stored.id && stored.name && stored.rgb && stored.createdAt && stored.updatedAt);
  },
});

// ===== 公開API =====

/** カスタムカラーストア（subscribe可能） */
export const customColorsStore = customColorsPersistence.store;

/** カスタムカラーを読み込み */
export function loadCustomColors(): void {
  customColorsPersistence.load();
}

/**
 * 新しいカスタムカラーを保存
 * @param colorData 0-255範囲のRGB値と名前
 */
export function saveCustomColor(colorData: { name: string; rgb: RGBColor255 }): void {
  const rgb = rgb255ToRgb(colorData.rgb);
  const now = new Date();

  // ファクトリのaddを使用（id, createdAtを明示的に設定）
  customColorsPersistence.add({
    id: generateId(),
    name: colorData.name.trim(),
    rgb,
    hsv: toHsv(rgb) as Hsv,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * カスタムカラーを更新
 * @param updates rgb255は0-255範囲
 */
export function updateCustomColor(
  id: string,
  updates: Partial<Pick<CustomColor, 'name'>> & { rgb255?: RGBColor255 }
): void {
  customColorsStore.update((colors) => {
    const updated = colors.map((color) => {
      if (color.id !== id) return color;

      const updatedColor: CustomColor = {
        ...color,
        ...updates,
        updatedAt: new Date(),
      };

      // RGB値が更新された場合はculori型に変換してHSV値も再計算
      if (updates.rgb255) {
        updatedColor.rgb = rgb255ToRgb(updates.rgb255);
        updatedColor.hsv = toHsv(updatedColor.rgb) as Hsv;
      }

      return updatedColor;
    });

    customColorsPersistence.setItems(updated);
    return updated;
  });
}

/**
 * カスタムカラーを削除
 */
export function deleteCustomColor(id: string): void {
  customColorsPersistence.remove(id);
}

/**
 * カスタムカラーを名前で検索
 */
export function findCustomColorByName(
  name: string,
  colors: CustomColor[]
): CustomColor | undefined {
  return colors.find((color) => color.name === name.trim());
}

/**
 * カスタムカラー名の重複チェック
 */
export function isNameDuplicate(name: string, excludeId?: string): boolean {
  const colors = get(customColorsStore);
  const trimmedName = name.trim();
  return colors.some((color) => color.name === trimmedName && color.id !== excludeId);
}

// ===== 初期化 =====

if (typeof window !== 'undefined') {
  loadCustomColors();
}
