import { writable } from 'svelte/store';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { selectionStore } from './selection';

// セッション中のみ保持する undo/redo（リロードでリセット）。
// 永続「履歴」の役割を引き継ぐ軽量なやり直し機能。
// Coolors 風に、配色を変える操作すべてを 1 ステップとして戻す/やり直す。

// 戻れる最大件数（お姉様のご要望: 10件程度）
const MAX_PAST = 10;

// 配色のスナップショット（selectionStore から transient を除いたもの）
type Snapshot = {
  primaryDye: DyeProps;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
};

let past: Snapshot[] = [];
let future: Snapshot[] = [];
let current: Snapshot | null = null;
// undo/redo による適用中は selectionStore の変化を新規記録しないためのフラグ
let isApplying = false;

// ボタンの活性状態を購読できるように公開
export const undoState = writable<{ canUndo: boolean; canRedo: boolean }>({
  canUndo: false,
  canRedo: false,
});

function syncState(): void {
  undoState.set({ canUndo: past.length > 0, canRedo: future.length > 0 });
}

function toSnapshot(state: {
  primaryDye: DyeProps | null;
  suggestedDyes: [DyeProps, DyeProps] | null;
  pattern: HarmonyPattern;
}): Snapshot | null {
  if (!state.primaryDye || !state.suggestedDyes) return null;
  return {
    primaryDye: state.primaryDye,
    suggestedDyes: state.suggestedDyes,
    pattern: state.pattern,
  };
}

// 同一配色（主色・提案2色・パターンが一致）なら記録しない
function isSameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.pattern === b.pattern &&
    a.primaryDye.id === b.primaryDye.id &&
    a.suggestedDyes[0].id === b.suggestedDyes[0].id &&
    a.suggestedDyes[1].id === b.suggestedDyes[1].id
  );
}

function applySnapshot(snap: Snapshot): void {
  isApplying = true;
  selectionStore.set({
    primaryDye: snap.primaryDye,
    suggestedDyes: snap.suggestedDyes,
    pattern: snap.pattern,
    harmonySeed: Date.now(),
  });
  isApplying = false;
}

/** 1 ステップ戻す */
export function undo(): void {
  if (past.length === 0 || !current) return;
  future.unshift(current);
  current = past.pop() ?? null;
  if (current) applySnapshot(current);
  syncState();
}

/** 1 ステップやり直す */
export function redo(): void {
  if (future.length === 0 || !current) return;
  past.push(current);
  current = future.shift() ?? null;
  if (current) applySnapshot(current);
  syncState();
}

// selectionStore を購読して配色変更を記録する。
// SSR 環境（静的生成）では購読不要なのでブラウザ時のみ。
if (typeof window !== 'undefined') {
  selectionStore.subscribe((state) => {
    if (isApplying) return;

    const snap = toSnapshot(state);
    if (!snap) return;

    // 同一配色は記録しない（メタリック切替で同結果になる等の重複防止）
    if (current && isSameSnapshot(current, snap)) return;

    if (current) {
      past.push(current);
      if (past.length > MAX_PAST) past.shift();
    }
    current = snap;
    // 新しい操作が入ったら redo 履歴は破棄
    future = [];
    syncState();
  });
}
