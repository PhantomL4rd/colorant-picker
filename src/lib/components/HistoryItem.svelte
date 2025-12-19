<script lang="ts">
import { Calendar, MousePointer, Heart, Check } from '@lucide/svelte';
import type { HistoryEntry } from '$lib/types';
import ShareButton from './ShareButton.svelte';
import { saveFavorite } from '$lib/stores/favorites';
import { getPatternLabel } from '$lib/constants/patterns';

interface Props {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
  onShare: (entry: HistoryEntry) => void;
}

const { entry, onSelect, onShare }: Props = $props();

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
    error = err instanceof Error ? err.message : 'お気に入りの追加に失敗しました。';
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

        <!-- 提案染料1 -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {entry.suggestedDyes[0].hex};"
            title={entry.suggestedDyes[0].name}
          ></div>
          <div class="text-xs mt-1 truncate" title={entry.suggestedDyes[0].name}>
            {entry.suggestedDyes[0].name}
          </div>
        </div>

        <!-- 提案染料2 -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {entry.suggestedDyes[1].hex};"
            title={entry.suggestedDyes[1].name}
          ></div>
          <div class="text-xs mt-1 truncate" title={entry.suggestedDyes[1].name}>
            {entry.suggestedDyes[1].name}
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

      <!-- お気に入り追加ボタン -->
      <button
        class="btn btn-sm"
        class:btn-success={showFeedback}
        class:btn-outline={!showFeedback}
        onclick={handleAddToFavorites}
        disabled={isAddingToFavorites}
        aria-label="お気に入りに追加"
      >
        {#if showFeedback}
          <Check class="w-4 h-4" />
        {:else if isAddingToFavorites}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <Heart class="w-4 h-4" />
        {/if}
      </button>

      <ShareButton
        favorite={{ ...entry, name: formatDate(entry.createdAt) }}
        onShare={handleShare}
      />
    </div>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(entry.pattern)}</span>
    </div>
  </div>
</div>
