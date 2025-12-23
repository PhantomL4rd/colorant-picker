<script lang="ts">
import { Calendar, Heart } from '@lucide/svelte';
import type { HistoryEntry } from '$lib/types';
import ShareButton from './ShareButton.svelte';
import PaletteColorPreview from './PaletteColorPreview.svelte';
import { saveFavorite, favoritesStore } from '$lib/stores/favorites';
import { getPatternLabel } from '$lib/constants/patterns';
import { Palette } from '$lib/models/Palette';

interface Props {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
  onShare: (entry: HistoryEntry) => void;
}

const { entry, onSelect, onShare }: Props = $props();

// パレットを生成
const palette = $derived(new Palette(entry.primaryDye, entry.suggestedDyes, entry.pattern));

// プレビュー用のカラー情報
const previewColors = $derived<[{ hex: string; name: string }, { hex: string; name: string }, { hex: string; name: string }]>([
  { hex: entry.primaryDye.hex, name: entry.primaryDye.name },
  { hex: palette.sub.dye.hex, name: palette.sub.dye.name },
  { hex: palette.accent.dye.hex, name: palette.accent.dye.name },
]);

// お気に入り一覧
const favorites = $derived($favoritesStore);

// 既にお気に入りに登録済みかチェック
const isAlreadyFavorited = $derived(palette.isIn(favorites));

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
    }, 800);
  } catch (err) {
    error = err instanceof Error ? err.message : 'スキ！の追加に失敗しました。';
  } finally {
    isAddingToFavorites = false;
  }
}
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー部分：日時と操作ボタン -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1 text-xs text-base-content/60">
          <Calendar class="w-4 h-4" />
          {formatDate(entry.createdAt)}
        </div>
      </div>

      <!-- 操作ボタン -->
      <div class="flex gap-1 ml-2">
        <!-- スキ！追加ボタン -->
        {#if showFeedback}
          <button
            class="btn btn-ghost btn-sm btn-circle text-red-500"
            disabled
            aria-label="スキ！"
          >
            <Heart class="w-4 h-4 animate-heart-flip" fill="currentColor" />
          </button>
        {:else if isAlreadyFavorited}
          <button
            class="btn btn-ghost btn-sm btn-circle text-success"
            disabled
            aria-label="スキ！済み"
          >
            <Heart class="w-4 h-4 fill-current" />
          </button>
        {:else}
          <button
            class="btn btn-ghost btn-sm btn-circle"
            onclick={handleAddToFavorites}
            disabled={isAddingToFavorites}
            aria-label="スキ！"
          >
            {#if isAddingToFavorites}
              <span class="loading loading-spinner loading-sm"></span>
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
    </div>

    <!-- エラーメッセージ -->
    {#if error}
      <div class="alert alert-error alert-sm mb-4">
        <span class="text-xs">{error}</span>
      </div>
    {/if}

    <!-- カラープレビュー（クリックで選択） -->
    <div class="mb-4">
      <PaletteColorPreview colors={previewColors} onSelect={handleSelect} />
    </div>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(entry.pattern)}</span>
    </div>
  </div>
</div>
