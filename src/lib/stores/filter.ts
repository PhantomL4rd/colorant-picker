import { derived, writable } from 'svelte/store';
import type { DyeCategory, FilterOptions } from '$lib/types';
import { dyeStore } from './dyes';

// フィルター設定ストア
export const filterStore = writable<FilterOptions>({
  categories: null,
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

// メタリック除外を切り替え
export function toggleExcludeMetallic(): void {
  filterStore.update((filter) => ({ ...filter, excludeMetallic: !filter.excludeMetallic }));
}

// フィルターをリセット
export function resetFilters(): void {
  filterStore.set({
    categories: null,
    excludeMetallic: false,
  });
}
