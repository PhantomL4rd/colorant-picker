<script lang="ts">
import { Calendar, MousePointer, Heart, Check } from '@lucide/svelte';
import type { HistoryEntry } from '$lib/types';
import ShareButton from './ShareButton.svelte';
import { saveFavorite, favoritesStore, isFavorited } from '$lib/stores/favorites';
import { getPatternLabel } from '$lib/constants/patterns';
import { Palette } from '$lib/models/Palette';

interface Props {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
  onShare: (entry: HistoryEntry) => void;
}

const { entry, onSelect, onShare }: Props = $props();

// パレットを生成
const palette = $derived(
  new Palette(entry.primaryDye, entry.suggestedDyes, entry.pattern)
);

// お気に入り一覧
const favorites = $derived($favoritesStore);

// 既にお気に入りに登録済みかチェック
const isAlreadyFavorited = $derived(
  isFavorited(favorites, entry.primaryDye, entry.suggestedDyes, entry.pattern)
);

// お気に入り追加の状態
let isAddingToFavorites = $state(false);
let showFeedback = $state(false);
let error = $state('');

// 作成日時のフォーマット
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '日時不明';
  }
}

function handleSelect() {
  onSelect(entry);
}

function handleShare() {
  onShare(entry);
}

async function handleAddToFavorites() {
  if (isAddingToFavorites || showFeedback) return;

  try {
    isAddingToFavorites = true;
    error = '';

    saveFavorite({
      primaryDye: entry.primaryDye,
      suggestedDyes: entry.suggestedDyes,
      pattern: entry.pattern,
    });

    // フィードバック表示
    showFeedback = true;
    setTimeout(() => {
      showFeedback = false;
    }, 2000);
  } catch (err) {
    error = err instanceof Error ? err.message : 'スキ！の追加に失敗しました。';
  } finally {
    isAddingToFavorites = false;
  }
}
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー部分：日時 -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1 text-xs text-base-content/60">
          <Calendar class="w-3 h-3" />
          {formatDate(entry.createdAt)}
        </div>
      </div>
    </div>

    <!-- エラーメッセージ -->
    {#if error}
      <div class="alert alert-error alert-sm mb-4">
        <span class="text-xs">{error}</span>
      </div>
    {/if}

    <!-- カラープレビュー -->
    <div class="mb-4">
      <div class="grid grid-cols-3 gap-2">
        <!-- プライマリ染料 -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {entry.primaryDye.hex};"
            title={entry.primaryDye.name}
          ></div>
          <div class="text-xs mt-1 truncate" title={entry.primaryDye.name}>
            {entry.primaryDye.name}
          </div>
        </div>

        <!-- サブ -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {palette.sub.dye.hex};"
            title={palette.sub.dye.name}
          ></div>
          <div class="text-xs mt-1 truncate" title={palette.sub.dye.name}>
            {palette.sub.dye.name}
          </div>
        </div>

        <!-- アクセント -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {palette.accent.dye.hex};"
            title={palette.accent.dye.name}
          ></div>
          <div class="text-xs mt-1 truncate" title={palette.accent.dye.name}>
            {palette.accent.dye.name}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作ボタン -->
    <div class="flex gap-2">
      <button
        class="btn btn-primary btn-sm flex-1"
        onclick={handleSelect}
      >
        <MousePointer class="w-4 h-4" />
        この組み合わせを選択
      </button>

      <!-- スキ！追加ボタン -->
      {#if isAlreadyFavorited}
        <button
          class="btn btn-sm btn-ghost text-success cursor-default"
          disabled
          aria-label="スキ！済み"
        >
          <Heart class="w-4 h-4 fill-current" />
        </button>
      {:else}
        <button
          class="btn btn-sm"
          class:btn-success={showFeedback}
          class:btn-outline={!showFeedback}
          onclick={handleAddToFavorites}
          disabled={isAddingToFavorites}
          aria-label="スキ！"
        >
          {#if showFeedback}
            <Check class="w-4 h-4" />
          {:else if isAddingToFavorites}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <Heart class="w-4 h-4" />
          {/if}
        </button>
      {/if}

      <ShareButton
        favorite={entry}
        onShare={handleShare}
      />
    </div>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(entry.pattern)}</span>
    </div>
  </div>
</div>
