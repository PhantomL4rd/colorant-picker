import { writable, get } from 'svelte/store';
import type {
  CustomColor,
  CustomColorsData,
  StoredCustomColor,
  RGBColor255,
  Hsv,
} from '$lib/types';
import { rgb255ToRgb, toHsv } from '$lib/utils/colorConversion';
import { loadFromStorage, saveToStorage as saveStorageUtil } from '$lib/utils/storageService';

const STORAGE_KEY = 'colorant-picker:custom-colors';
const VERSION = '1.0.0';

// カスタムカラーストア
export const customColorsStore = writable<CustomColor[]>([]);

/**
 * LocalStorageからカスタムカラーを読み込み
 */
export function loadCustomColors(): void {
  try {
    // ブラウザ環境チェック
    if (typeof localStorage === 'undefined') {
      customColorsStore.set([]);
      return;
    }

    const data: CustomColorsData = loadFromStorage<CustomColorsData>(STORAGE_KEY, {
      colors: [],
      version: VERSION,
      lastUpdated: new Date().toISOString(),
    });

    // 0-255範囲からculori型に変換 + 日付文字列をDateオブジェクトに変換
    const colors: CustomColor[] = data.colors.map((color) => {
      const rgb = rgb255ToRgb(color.rgb);
      return {
        ...color,
        rgb,
        hsv: toHsv(rgb) as Hsv,
        createdAt: new Date(color.createdAt),
        updatedAt: new Date(color.updatedAt),
      };
    });

    customColorsStore.set(colors);
  } catch (error) {
    console.error('Failed to load custom colors:', error);
    customColorsStore.set([]);
  }
}

/**
 * LocalStorageにカスタムカラーを保存
 */
// StoredCustomColor形式に変換（計算値を除外、0-255範囲に変換）
function toStoredCustomColor(color: CustomColor): StoredCustomColor {
  return {
    id: color.id,
    name: color.name,
    rgb: {
      r: Math.round(color.rgb.r * 255),
      g: Math.round(color.rgb.g * 255),
      b: Math.round(color.rgb.b * 255),
    },
    createdAt: color.createdAt,
    updatedAt: color.updatedAt,
  };
}

function saveToStorage(colors: CustomColor[]): void {
  try {
    // 新形式（軽量）で保存
    const storedColors: StoredCustomColor[] = colors.map(toStoredCustomColor);

    const data = {
      colors: storedColors,
      version: VERSION,
      lastUpdated: new Date().toISOString(),
    };

    saveStorageUtil(STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save custom colors:', error);
    throw new Error('カスタムカラーの保存に失敗しました');
  }
}

/**
 * 新しいカスタムカラーを保存
 * @param colorData 0-255範囲のRGB値と名前
 */
export function saveCustomColor(colorData: { name: string; rgb: RGBColor255 }): void {
  const rgb = rgb255ToRgb(colorData.rgb);
  const newColor: CustomColor = {
    id: crypto.randomUUID(),
    name: colorData.name.trim(),
    rgb,
    hsv: toHsv(rgb) as Hsv,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  customColorsStore.update((colors) => {
    const updated = [...colors, newColor];
    saveToStorage(updated);
    return updated;
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

    saveToStorage(updated);
    return updated;
  });
}

/**
 * カスタムカラーを削除
 */
export function deleteCustomColor(id: string): void {
  customColorsStore.update((colors) => {
    const updated = colors.filter((color) => color.id !== id);
    saveToStorage(updated);
    return updated;
  });
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

// 初期化時にカスタムカラーを読み込み
loadCustomColors();
