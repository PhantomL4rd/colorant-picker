/**
 * 永続化ストアファクトリ
 * LocalStorage永続化の共通ロジックを提供
 */

import { type Writable, writable } from 'svelte/store';
import { loadFromStorage, saveToStorage } from './storageService';
import { generateId } from './uuid';

// ===== エラー定義 =====

/** ストレージエラーコード */
export type StorageErrorCode = 'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'SAVE_ERROR' | 'LOAD_ERROR';

/** エラーメッセージ定義 */
const ERROR_MESSAGES: Record<StorageErrorCode, string> = {
  QUOTA_EXCEEDED: 'ストレージ容量が不足しています。古いデータを削除してください。',
  PARSE_ERROR: 'データの読み込みに失敗しました。',
  SAVE_ERROR: 'データの保存に失敗しました。',
  LOAD_ERROR: 'データの読み込みに失敗しました。',
};

/** ストレージ操作エラー */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode
  ) {
    super(message);
    this.name = 'StorageError';
  }

  /** エラーコードから適切なエラーを生成 */
  static fromCode(code: StorageErrorCode): StorageError {
    return new StorageError(ERROR_MESSAGES[code], code);
  }
}

// ===== 型定義 =====

/** 永続化ストアの設定 */
export interface PersistentStoreConfig<T, S> {
  /** LocalStorageのキー */
  key: string;
  /** データバージョン */
  version: string;
  /** 最大保存件数（無制限の場合は省略） */
  maxItems?: number;
  /** ランタイム型から保存型への変換 */
  toStorable: (item: T) => S;
  /** 保存型からランタイム型への変換 */
  fromStorable: (stored: S) => T;
  /** データ検証（オプション） */
  validate?: (item: S) => boolean;
}

/** LocalStorageに保存するデータ構造 */
interface PersistentStoreData<S> {
  items: S[];
  version: string;
}

/** 永続化ストアのインターフェース */
export interface PersistentStore<T extends { id: string; createdAt?: string | Date }> {
  /** Svelteストア（subscribe可能） */
  store: Writable<T[]>;
  /** データを読み込み */
  load: () => void;
  /** アイテムを追加（IDとcreatedAtを自動付与） */
  add: (item: Omit<T, 'id' | 'createdAt'> & Partial<Pick<T, 'id' | 'createdAt'>>) => T;
  /** アイテムを更新 */
  update: (id: string, updates: Partial<T>) => void;
  /** アイテムを削除 */
  remove: (id: string) => void;
  /** 全データをクリア */
  clear: () => void;
  /** 直接ストアを更新（高度な操作用） */
  setItems: (items: T[]) => void;
}

// ===== ファクトリ関数 =====

/**
 * 永続化ストアを作成する
 */
export function createPersistentStore<
  T extends { id: string; createdAt?: string | Date },
  S extends { id: string },
>(config: PersistentStoreConfig<T, S>): PersistentStore<T> {
  const { key, version, maxItems, toStorable, fromStorable, validate } = config;

  // Svelteストアを作成
  const store = writable<T[]>([]);

  /**
   * LocalStorageからデータを読み込み
   */
  function load(): void {
    // ブラウザ環境チェック
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      store.set([]);
      return;
    }

    try {
      const data = loadFromStorage<PersistentStoreData<S>>(key, {
        items: [],
        version,
      });

      // バージョンチェック
      if (data.version !== version) {
        console.warn(`${key}: データバージョンが異なります。初期化します。`);
        store.set([]);
        return;
      }

      // データ検証 + 変換
      const validItems = data.items
        .filter((item) => {
          if (!item.id) return false;
          if (validate && !validate(item)) return false;
          return true;
        })
        .map((item) => {
          try {
            return fromStorable(item);
          } catch {
            console.warn(`${key}: アイテムの変換に失敗しました:`, item);
            return null;
          }
        })
        .filter((item): item is T => item !== null);

      store.set(validItems);
    } catch (error) {
      console.error(`${key}: データの読み込みに失敗しました:`, error);
      store.set([]);
    }
  }

  /**
   * LocalStorageにデータを保存
   */
  function save(items: T[]): void {
    // ブラウザ環境チェック
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const storedItems = items.map(toStorable);
      const data: PersistentStoreData<S> = {
        items: storedItems,
        version,
      };

      const success = saveToStorage(key, data);
      if (!success) {
        throw StorageError.fromCode('SAVE_ERROR');
      }
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw StorageError.fromCode('QUOTA_EXCEEDED');
      }
      if (error instanceof StorageError) {
        throw error;
      }
      throw StorageError.fromCode('SAVE_ERROR');
    }
  }

  /**
   * アイテムを追加
   */
  function add(item: Omit<T, 'id' | 'createdAt'> & Partial<Pick<T, 'id' | 'createdAt'>>): T {
    const newItem = {
      ...item,
      id: item.id ?? generateId(),
      createdAt: item.createdAt ?? new Date().toISOString(),
    } as T;

    store.update((items) => {
      let updated = [newItem, ...items];

      // 最大件数を超えた場合は古いエントリを削除
      if (maxItems && updated.length > maxItems) {
        updated = updated.slice(0, maxItems);
      }

      save(updated);
      return updated;
    });

    return newItem;
  }

  /**
   * アイテムを更新
   */
  function update(id: string, updates: Partial<T>): void {
    store.update((items) => {
      const updated = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      save(updated);
      return updated;
    });
  }

  /**
   * アイテムを削除
   */
  function remove(id: string): void {
    store.update((items) => {
      const updated = items.filter((item) => item.id !== id);
      save(updated);
      return updated;
    });
  }

  /**
   * 全データをクリア
   */
  function clear(): void {
    store.set([]);
    save([]);
  }

  /**
   * 直接ストアを更新（高度な操作用）
   */
  function setItems(items: T[]): void {
    let updated = items;
    if (maxItems && updated.length > maxItems) {
      updated = updated.slice(0, maxItems);
    }
    store.set(updated);
    save(updated);
  }

  return {
    store,
    load,
    add,
    update,
    remove,
    clear,
    setItems,
  };
}
