import { writable } from 'svelte/store';
import type {
  HistoryEntry,
  HistoryData,
  DyeProps,
  HarmonyPattern,
  ExtendedDye,
  StoredHistoryEntry,
  StoredDye,
} from '$lib/types';
import { Dye } from '$lib/models/Dye';
import { isCustomDye } from '$lib/utils/customColorUtils';
import { loadFromStorage, saveToStorage } from '$lib/utils/storageService';
import { emitRestorePalette } from './paletteEvents';
import { selectionStore } from './selection';

// 履歴ストア
export const historyStore = writable<HistoryEntry[]>([]);

// LocalStorageキー
const STORAGE_KEY = 'colorant-picker:history';
const STORAGE_VERSION = '1.0.0';
const MAX_HISTORY = 10;

// UUIDを生成
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// LocalStorageから履歴を読み込み
export function loadHistory(): void {
  try {
    const data: HistoryData = loadFromStorage<HistoryData>(STORAGE_KEY, {
      entries: [],
      version: STORAGE_VERSION,
    });

    // データバージョンチェック
    if (data.version !== STORAGE_VERSION) {
      console.warn('履歴データのバージョンが異なります。初期化します。');
      historyStore.set([]);
      return;
    }

    // データ検証 + Dyeクラスインスタンス化
    const validEntries = data.entries
      .filter((entry) => {
        return (
          entry.id && entry.primaryDye && entry.suggestedDyes && entry.pattern && entry.createdAt
        );
      })
      .map((entry) => ({
        ...entry,
        primaryDye: new Dye(entry.primaryDye),
        suggestedDyes: [new Dye(entry.suggestedDyes[0]), new Dye(entry.suggestedDyes[1])] as [
          DyeProps,
          DyeProps,
        ],
      }));

    historyStore.set(validEntries);
  } catch (error) {
    console.error('履歴の読み込みに失敗しました:', error);
    historyStore.set([]);
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

// LocalStorageに履歴を保存
function saveHistoryToStorage(entries: HistoryEntry[]): void {
  try {
    const storedEntries: StoredHistoryEntry[] = entries.map((entry) => ({
      id: entry.id,
      primaryDye: toStoredDye(entry.primaryDye),
      suggestedDyes: [toStoredDye(entry.suggestedDyes[0]), toStoredDye(entry.suggestedDyes[1])],
      pattern: entry.pattern,
      createdAt: entry.createdAt,
    }));

    const data: HistoryData = {
      entries: storedEntries,
      version: STORAGE_VERSION,
    };

    saveToStorage(STORAGE_KEY, data);
  } catch (error) {
    // 容量制限エラー等はログ出力のみで処理継続
    console.error('履歴の保存に失敗しました:', error);
  }
}

// 組み合わせの同一性判定
function isSameEntry(
  a: { primaryDye: DyeProps; suggestedDyes: [DyeProps, DyeProps]; pattern: HarmonyPattern },
  b: HistoryEntry
): boolean {
  return (
    a.primaryDye.id === b.primaryDye.id &&
    a.suggestedDyes[0].id === b.suggestedDyes[0].id &&
    a.suggestedDyes[1].id === b.suggestedDyes[1].id &&
    a.pattern === b.pattern
  );
}

// 履歴に追加
export function addToHistory(input: {
  primaryDye: DyeProps | ExtendedDye;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
}): void {
  // カスタムカラーの場合はDyeクラスインスタンスを生成
  let primaryDyeForStorage: DyeProps;
  if (isCustomDye(input.primaryDye)) {
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

  const entryData = {
    primaryDye: primaryDyeForStorage,
    suggestedDyes: input.suggestedDyes,
    pattern: input.pattern,
  };

  historyStore.update((entries) => {
    // 重複チェック
    const existingIndex = entries.findIndex((e) => isSameEntry(entryData, e));

    if (existingIndex !== -1) {
      // 既存エントリを先頭に移動
      const existing = entries[existingIndex];
      const updated = [
        { ...existing, createdAt: new Date().toISOString() },
        ...entries.slice(0, existingIndex),
        ...entries.slice(existingIndex + 1),
      ];
      saveHistoryToStorage(updated);
      return updated;
    }

    // 新規エントリを作成
    const newEntry: HistoryEntry = {
      id: generateId(),
      ...entryData,
      createdAt: new Date().toISOString(),
    };

    // 先頭に追加し、MAX_HISTORYを超えたら末尾を削除
    const updated = [newEntry, ...entries].slice(0, MAX_HISTORY);
    saveHistoryToStorage(updated);
    return updated;
  });
}

// 履歴から復元
export function restoreFromHistory(entry: HistoryEntry): void {
  try {
    // カスタムカラーかチェック
    let primaryDye: DyeProps | ExtendedDye;
    if (entry.primaryDye.tags?.includes('custom')) {
      primaryDye = {
        ...entry.primaryDye,
        source: 'custom',
      } as ExtendedDye;
    } else {
      primaryDye = entry.primaryDye;
    }

    // イベントを発火してパレットを復元
    emitRestorePalette({
      primaryDye,
      suggestedDyes: entry.suggestedDyes,
      pattern: entry.pattern,
    });
  } catch (error) {
    console.error('履歴の復元に失敗しました:', error);
    throw error;
  }
}

// selectionStoreの変更を監視して自動記録
let previousSelection: {
  primaryDye: DyeProps | ExtendedDye | null;
  suggestedDyes: [DyeProps, DyeProps] | null;
  pattern: HarmonyPattern;
} | null = null;

if (typeof window !== 'undefined') {
  // 初期化時に履歴を読み込み
  loadHistory();

  // selectionStoreを監視
  selectionStore.subscribe((selection) => {
    // suggestedDyesが確定している場合のみ記録
    if (selection.primaryDye && selection.suggestedDyes) {
      // 前回と同じ場合はスキップ
      if (
        previousSelection &&
        previousSelection.primaryDye?.id === selection.primaryDye.id &&
        previousSelection.suggestedDyes?.[0].id === selection.suggestedDyes[0].id &&
        previousSelection.suggestedDyes?.[1].id === selection.suggestedDyes[1].id &&
        previousSelection.pattern === selection.pattern
      ) {
        return;
      }

      // 履歴に追加
      addToHistory({
        primaryDye: selection.primaryDye,
        suggestedDyes: selection.suggestedDyes,
        pattern: selection.pattern,
      });

      // 前回の選択を更新
      previousSelection = {
        primaryDye: selection.primaryDye,
        suggestedDyes: selection.suggestedDyes,
        pattern: selection.pattern,
      };
    }
  });
}
