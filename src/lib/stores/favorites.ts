import { writable } from 'svelte/store';
import type {
  Favorite,
  FavoritesData,
  DyeProps,
  HarmonyPattern,
  ExtendedDye,
  StoredDye,
  StoredFavorite,
} from '$lib/types';
import { Dye } from '$lib/models/Dye';
import { isCustomDye } from '$lib/utils/customColorUtils';
import { loadFromStorage, saveToStorage } from '$lib/utils/storageService';
import { emitRestorePalette } from './paletteEvents';
import { submitPalette } from '$lib/utils/paletteSubmit';

// お気に入りストア
export const favoritesStore = writable<Favorite[]>([]);

// LocalStorageキー
const STORAGE_KEY = 'colorant-picker:favorites';
const STORAGE_VERSION = '1.0.0';
const MAX_FAVORITES = 100;

// UUIDを生成（ブラウザ標準APIまたはfallback）
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// LocalStorageからお気に入りを読み込み
export function loadFavorites(): void {
  try {
    const data: FavoritesData = loadFromStorage<FavoritesData>(STORAGE_KEY, {
      favorites: [],
      version: STORAGE_VERSION,
    });

    // データバージョンチェック
    if (data.version !== STORAGE_VERSION) {
      console.warn('お気に入りデータのバージョンが異なります。初期化します。');
      favoritesStore.set([]);
      return;
    }

    // データ検証 + Dyeクラスインスタンス化
    const validFavorites = data.favorites
      .filter((favorite) => {
        return (
          favorite.id &&
          favorite.primaryDye &&
          favorite.suggestedDyes &&
          favorite.pattern &&
          favorite.createdAt
        );
      })
      .map((favorite) => ({
        ...favorite,
        primaryDye: new Dye(favorite.primaryDye),
        suggestedDyes: [new Dye(favorite.suggestedDyes[0]), new Dye(favorite.suggestedDyes[1])] as [
          DyeProps,
          DyeProps,
        ],
      }));

    favoritesStore.set(validFavorites);
  } catch (error) {
    console.error('お気に入りの読み込みに失敗しました:', error);
    favoritesStore.set([]);
  }
}

// StoredDye形式に変換（計算値を除外）
function toStoredDye(dye: DyeProps): StoredDye {
  return {
    id: dye.id,
    name: dye.name,
    category: dye.category,
    rgb: dye.rgb,
    tags: dye.tags,
  };
}

// LocalStorageにお気に入りを保存
function saveFavoritesToStorage(favorites: Favorite[]): void {
  try {
    // 新形式（軽量）で保存
    const storedFavorites: StoredFavorite[] = favorites.map((favorite) => ({
      ...favorite,
      primaryDye: toStoredDye(favorite.primaryDye),
      suggestedDyes: [
        toStoredDye(favorite.suggestedDyes[0]),
        toStoredDye(favorite.suggestedDyes[1]),
      ],
    }));

    const data = {
      favorites: storedFavorites,
      version: STORAGE_VERSION,
    };

    saveToStorage(STORAGE_KEY, data);
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      // QuotaExceededError - ストレージ容量不足
      throw new Error('ストレージ容量が不足しています。古いスキ！を削除してください。');
    }
    throw error;
  }
}

// お気に入りを保存（カスタムカラー対応）
export function saveFavorite(input: {
  primaryDye: DyeProps | ExtendedDye;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
}): void {
  try {
    favoritesStore.update((favorites) => {
      // 最大件数チェック
      if (favorites.length >= MAX_FAVORITES) {
        throw new Error(`スキ！は最大${MAX_FAVORITES}件まで保存できます。`);
      }

      // カスタムカラーの場合はDyeクラスインスタンスとして保存
      let primaryDyeForStorage: DyeProps;
      if (isCustomDye(input.primaryDye)) {
        // カスタムカラーの場合はDyeクラスインスタンスを生成
        primaryDyeForStorage = new Dye({
          id: input.primaryDye.id,
          name: input.primaryDye.name,
          category: input.primaryDye.category,
          rgb: input.primaryDye.rgb,
          tags: ['custom'],
        });
      } else {
        primaryDyeForStorage = input.primaryDye;
      }

      const newFavorite: Favorite = {
        id: generateId(),
        primaryDye: primaryDyeForStorage,
        suggestedDyes: input.suggestedDyes,
        pattern: input.pattern,
        createdAt: new Date().toISOString(),
      };

      const updated = [...favorites, newFavorite];
      saveFavoritesToStorage(updated);

      // バックグラウンドでサーバーにパレットを投稿（カスタムカラー除く）
      // 投稿の成功/失敗に関わらずローカル保存は完了させる
      submitPalette({
        primaryDye: primaryDyeForStorage,
        suggestedDyes: input.suggestedDyes,
        pattern: input.pattern,
      });

      return updated;
    });
  } catch (error) {
    console.error('お気に入りの保存に失敗しました:', error);
    throw error;
  }
}

// お気に入りを削除
export function deleteFavorite(favoriteId: string): void {
  try {
    favoritesStore.update((favorites) => {
      const updated = favorites.filter((f) => f.id !== favoriteId);
      saveFavoritesToStorage(updated);
      return updated;
    });
  } catch (error) {
    console.error('お気に入りの削除に失敗しました:', error);
    throw error;
  }
}

// お気に入りを復元（選択状態に設定、カスタムカラー対応）
export function restoreFavorite(favorite: Favorite): void {
  try {
    // カスタムカラーかチェック（tagsにcustomが含まれている場合）
    let primaryDye: DyeProps | ExtendedDye;
    if (favorite.primaryDye.tags?.includes('custom')) {
      // カスタムカラーの場合はExtendedDyeとして扱う
      primaryDye = {
        ...favorite.primaryDye,
        source: 'custom',
      } as ExtendedDye;
    } else {
      primaryDye = favorite.primaryDye;
    }

    // イベントを発火してパレットを復元
    emitRestorePalette({
      primaryDye,
      suggestedDyes: favorite.suggestedDyes,
      pattern: favorite.pattern,
    });
  } catch (error) {
    console.error('お気に入りの復元に失敗しました:', error);
    throw error;
  }
}

// 初期化時にお気に入りを読み込み
if (typeof window !== 'undefined') {
  loadFavorites();
}
