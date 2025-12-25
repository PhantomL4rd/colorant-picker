import { derived, writable } from 'svelte/store';
import type { DyeCategory, FilterOptions } from '$lib/types';
import { dyeStore } from './dyes';

// フィルター設定ストア
export const filterStore = writable<FilterOptions>({
  categories: null,
  hueRange: [0, 360],
  saturationRange: [0, 100],
  valueRange: [0, 100],
  excludeMetallic: false,
});

// フィルタリングされたカララント一覧
export const filteredDyes = derived([dyeStore, filterStore], ([$dyes, $filter]) => {
  return $dyes.filter((dye) => {
    // カテゴリフィルター
    if ($filter.categories && $filter.categories !== dye.category) {
      return false;
    }

    // メタリック除外フィルター
    if ($filter.excludeMetallic && dye.tags?.includes('metallic')) {
      return false;
    }

    // culori Hsvはh,s,vがundefinedの可能性がある（無彩色など）
    const h = dye.hsv.h ?? 0;
    const s = (dye.hsv.s ?? 0) * 100; // 0-1 → 0-100
    const v = (dye.hsv.v ?? 0) * 100; // 0-1 → 0-100

    // 色相範囲フィルター
    if (h < $filter.hueRange[0] || h > $filter.hueRange[1]) {
      return false;
    }

    // 彩度範囲フィルター
    if (s < $filter.saturationRange[0] || s > $filter.saturationRange[1]) {
      return false;
    }

    // 明度範囲フィルター
    if (v < $filter.valueRange[0] || v > $filter.valueRange[1]) {
      return false;
    }

    return true;
  });
});

// カテゴリフィルターを設定
export function setCategory(category: DyeCategory | null): void {
  filterStore.update((filter) => ({ ...filter, categories: category }));
}

// カテゴリフィルターをトグル
export function toggleCategory(category: DyeCategory): void {
  filterStore.update((filter) => {
    const newCategory = filter.categories === category ? null : category;
    return { ...filter, categories: newCategory };
  });
}

// 色相範囲を設定
export function setHueRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, hueRange: range }));
}

// 彩度範囲を設定
export function setSaturationRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, saturationRange: range }));
}

// 明度範囲を設定
export function setValueRange(range: [number, number]): void {
  filterStore.update((filter) => ({ ...filter, valueRange: range }));
}

// メタリック除外を切り替え
export function toggleExcludeMetallic(): void {
  filterStore.update((filter) => ({ ...filter, excludeMetallic: !filter.excludeMetallic }));
}

// フィルターをリセット
export function resetFilters(): void {
  filterStore.set({
    categories: null,
    hueRange: [0, 360],
    saturationRange: [0, 100],
    valueRange: [0, 100],
    excludeMetallic: false,
  });
}
