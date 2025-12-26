/**
 * 履歴ストア
 * パレットの選択履歴を管理（LocalStorage永続化）
 */

import { Dye } from '$lib/models/Dye';
import type {
  DyeProps,
  ExtendedDye,
  HarmonyPattern,
  HistoryEntry,
  StoredHistoryEntry,
} from '$lib/types';
import { isCustomDye } from '$lib/utils/color/customColorUtils';
import { dyeToStorable } from '$lib/utils/storage/dyeSerializer';
import { createPersistentStore } from '$lib/utils/storage/persistentStore';
import { emitRestorePalette } from './paletteEvents';
import { selectionStore } from './selection';

// ===== 定数 =====

const STORAGE_KEY = 'colorant-picker:history';
const STORAGE_VERSION = '1.0.0';
const MAX_HISTORY = 10;

/**
 * 組み合わせの同一性判定
 */
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

// ===== 永続化ストア =====

const historyPersistence = createPersistentStore<HistoryEntry, StoredHistoryEntry>({
  key: STORAGE_KEY,
  version: STORAGE_VERSION,
  maxItems: MAX_HISTORY,
  toStorable: (entry) => ({
    id: entry.id,
    primaryDye: dyeToStorable(entry.primaryDye),
    suggestedDyes: [dyeToStorable(entry.suggestedDyes[0]), dyeToStorable(entry.suggestedDyes[1])],
    pattern: entry.pattern,
    createdAt: entry.createdAt,
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

/** 履歴ストア（subscribe可能） */
export const historyStore = historyPersistence.store;

/** 履歴を読み込み */
export function loadHistory(): void {
  historyPersistence.load();
}

/** 履歴に追加（重複時は先頭に移動） */
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

  // 重複チェックのためストアを直接操作
  historyStore.update((entries) => {
    const existingIndex = entries.findIndex((e) => isSameEntry(entryData, e));

    if (existingIndex !== -1) {
      // 既存エントリを先頭に移動（createdAtを更新）
      const existing = entries[existingIndex];
      const updated = [
        { ...existing, createdAt: new Date().toISOString() },
        ...entries.slice(0, existingIndex),
        ...entries.slice(existingIndex + 1),
      ];
      historyPersistence.setItems(updated);
      return updated;
    }

    // 新規エントリを追加
    const newEntry = historyPersistence.add(entryData);
    // addは内部でstore.updateを呼ぶので、ここでは何も返さなくてよいが、
    // update関数なので現在の状態を返す必要がある
    // ただし、addは既にストアを更新しているので、単に現在の状態を取得
    let current: HistoryEntry[] = [];
    historyStore.subscribe((v) => (current = v))();
    return current;
  });
}

/** 履歴から復元 */
export function restoreFromHistory(entry: HistoryEntry): void {
  try {
    let primaryDye: DyeProps | ExtendedDye;
    if (entry.primaryDye.tags?.includes('custom')) {
      primaryDye = {
        ...entry.primaryDye,
        source: 'custom',
      } as ExtendedDye;
    } else {
      primaryDye = entry.primaryDye;
    }

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

// ===== 自動記録（selectionStore監視） =====

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
