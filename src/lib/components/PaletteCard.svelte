<script lang="ts">
import { Calendar, Heart, Trash2, X } from '@lucide/svelte';
import { getPatternLabel } from '$lib/constants/patterns';
import type { Favorite, HarmonyPattern } from '$lib/types';
import HeartBurst, { type HeartBurstApi } from './HeartBurst.svelte';
import PaletteColorPreview from './PaletteColorPreview.svelte';
import ShareButton from './ShareButton.svelte';

type PreviewColor = { hex: string; name: string };

interface Props {
  // 必須: 表示データ
  colors: [PreviewColor, PreviewColor, PreviewColor];
  pattern: HarmonyPattern;
  favoriteForShare: Favorite;

  // オプション: 表示制御
  createdAt?: string;
  showFavoriteButton?: boolean;
  isFavorited?: boolean;
  showDeleteButton?: boolean;

  // コールバック
  onSelect: () => void;
  onShare: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
}

const {
  colors,
  pattern,
  favoriteForShare,
  createdAt,
  showFavoriteButton = false,
  isFavorited = false,
  showDeleteButton = false,
  onSelect,
  onShare,
  onFavorite,
  onDelete,
}: Props = $props();

// お気に入り追加の状態
let isAddingToFavorites = $state(false);
let showFeedback = $state(false);

// 削除確認状態
let isDeleting = $state(false);

// エラー状態
let error = $state('');

// ハートバースト
let heartBurst: HeartBurstApi | undefined = $state();

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

async function handleFavorite() {
  if (isAddingToFavorites || showFeedback || !onFavorite) return;

  try {
    isAddingToFavorites = true;
    error = '';

    onFavorite();

    // ハートバースト + フィードバック表示
    heartBurst?.trigger();
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

function handleDelete() {
  if (!isDeleting) {
    isDeleting = true;
    return;
  }

  if (onDelete) {
    try {
      onDelete();
    } catch (err) {
      error = err instanceof Error ? err.message : '削除に失敗しました。';
      isDeleting = false;
    }
  }
}

function cancelDelete() {
  isDeleting = false;
}
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー部分：日時と操作ボタン -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        {#if createdAt}
          <div class="flex items-center gap-1 text-xs text-base-content/60">
            <Calendar class="w-4 h-4" />
            {formatDate(createdAt)}
          </div>
        {/if}
      </div>

      <!-- 操作ボタン -->
      <div class="flex gap-1 ml-2">
        {#if showFavoriteButton}
          <!-- スキ！追加ボタン -->
          <div class="relative">
            <HeartBurst bind:this={heartBurst} />

            {#if showFeedback}
              <button
                class="btn btn-ghost btn-sm btn-circle text-red-500"
                disabled
                aria-label="スキ！"
              >
                <Heart class="w-4 h-4 animate-heart-flip" fill="currentColor" />
              </button>
            {:else if isFavorited}
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
                onclick={handleFavorite}
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
          </div>
        {/if}

        <ShareButton favorite={favoriteForShare} {onShare} />
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
      <PaletteColorPreview {colors} {onSelect} />
    </div>

    <!-- フッター：パターンと削除ボタン -->
    <div class="flex justify-center items-center mt-2 relative">
      <span class="badge badge-outline badge-sm">{getPatternLabel(pattern)}</span>

      {#if showDeleteButton}
        <!-- 削除ボタン -->
        <div class="absolute right-0">
          {#if isDeleting}
            <div class="flex gap-1">
              <button class="btn btn-error btn-xs" onclick={handleDelete} aria-label="削除を確認">
                削除
              </button>
              <button
                class="btn btn-ghost btn-xs"
                onclick={cancelDelete}
                aria-label="削除をキャンセル"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          {:else}
            <button
              class="btn btn-ghost btn-xs btn-circle"
              onclick={handleDelete}
              aria-label="削除"
            >
              <Trash2 class="w-3 h-3 text-error" />
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
