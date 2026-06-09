/**
 * お気に入りストア
 * パレットのお気に入り機能を提供（LocalStorage永続化）
 */

import { Dye } from '$lib/models/Dye';
import type { DyeProps, Favorite, HarmonyPattern, StoredFavorite } from '$lib/types';
import { dyeToStorable } from '$lib/utils/storage/dyeSerializer';
import { submitPalette } from '$lib/utils/api/paletteSubmit';
import { createPersistentStore } from '$lib/utils/storage/persistentStore';
import { emitRestorePalette } from './paletteEvents';

// ===== 定数 =====

const STORAGE_KEY = 'colorant-picker:favorites';
const STORAGE_VERSION = '1.0.0';
const MAX_FAVORITES = 100;

// ===== 永続化ストア =====

const favoritesPersistence = createPersistentStore<Favorite, StoredFavorite>({
  key: STORAGE_KEY,
  version: STORAGE_VERSION,
  maxItems: MAX_FAVORITES,
  toStorable: (favorite) => ({
    id: favorite.id,
    primaryDye: dyeToStorable(favorite.primaryDye),
    suggestedDyes: [
      dyeToStorable(favorite.suggestedDyes[0]),
      dyeToStorable(favorite.suggestedDyes[1]),
    ],
    pattern: favorite.pattern,
    createdAt: favorite.createdAt,
  }),
  fromStorable: (stored) => ({
    id: stored.id,
    primaryDye: new Dye(stored.primaryDye),
    suggestedDyes: [new Dye(stored.suggestedDyes[0]), new Dye(stored.suggestedDyes[1])] as [
      DyeProps,
      DyeProps,
    ],
    pattern: stored.pattern,
    createdAt: stored.createdAt,
  }),
  validate: (stored) => {
    // 過去のカスタムカラー機能で保存されたエントリは除外
    if (stored.primaryDye?.tags?.includes('custom' as never)) return false;
    return !!(
      stored.id &&
      stored.primaryDye &&
      stored.suggestedDyes &&
      stored.pattern &&
      stored.createdAt
    );
  },
});

// ===== 公開API =====

/** お気に入りストア（subscribe可能） */
export const favoritesStore = favoritesPersistence.store;

/** お気に入りを読み込み */
export function loadFavorites(): void {
  favoritesPersistence.load();
}

/** お気に入りを保存 */
export function saveFavorite(input: {
  primaryDye: DyeProps;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
}): void {
  favoritesPersistence.add({
    primaryDye: input.primaryDye,
    suggestedDyes: input.suggestedDyes,
    pattern: input.pattern,
  });

  // バックグラウンドでサーバーにパレットを投稿
  submitPalette({
    primaryDye: input.primaryDye,
    suggestedDyes: input.suggestedDyes,
    pattern: input.pattern,
  });
}

/** お気に入りを削除 */
export function deleteFavorite(favoriteId: string): void {
  favoritesPersistence.remove(favoriteId);
}

/** お気に入りを復元（選択状態に設定） */
export function restoreFavorite(favorite: Favorite): void {
  try {
    emitRestorePalette({
      primaryDye: favorite.primaryDye,
      suggestedDyes: favorite.suggestedDyes,
      pattern: favorite.pattern,
    });
  } catch (error) {
    console.error('お気に入りの復元に失敗しました:', error);
    throw error;
  }
}

// ===== 初期化 =====

if (typeof window !== 'undefined') {
  loadFavorites();
}
