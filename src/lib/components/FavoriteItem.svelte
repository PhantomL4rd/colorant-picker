<script lang="ts">
import { Trash2, X, Calendar } from '@lucide/svelte';
import type { Favorite } from '$lib/types';
import ShareButton from './ShareButton.svelte';
import PaletteColorPreview from './PaletteColorPreview.svelte';
import { deleteFavorite } from '$lib/stores/favorites';
import { getPatternLabel } from '$lib/constants/patterns';
import { Palette } from '$lib/models/Palette';

interface Props {
  favorite: Favorite;
  onSelect: (favorite: Favorite) => void;
  onShare: (favorite: Favorite) => void;
}

const { favorite, onSelect, onShare }: Props = $props();

// パレットを生成
const palette = $derived(
  new Palette(favorite.primaryDye, favorite.suggestedDyes, favorite.pattern)
);

// プレビュー用のカラー情報
const previewColors = $derived<
  [{ hex: string; name: string }, { hex: string; name: string }, { hex: string; name: string }]
>([
  { hex: favorite.primaryDye.hex, name: favorite.primaryDye.name },
  { hex: palette.sub.dye.hex, name: palette.sub.dye.name },
  { hex: palette.accent.dye.hex, name: palette.accent.dye.name },
]);

// 削除確認状態
let isDeleting = $state(false);
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

async function handleDelete() {
  if (!isDeleting) {
    isDeleting = true;
    return;
  }

  try {
    await deleteFavorite(favorite.id);
  } catch (err) {
    error = err instanceof Error ? err.message : '削除に失敗しました。';
    isDeleting = false;
  }
}

function cancelDelete() {
  isDeleting = false;
}

function handleSelect() {
  onSelect(favorite);
}

function handleShare() {
  onShare(favorite);
}
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー部分：日時と操作ボタン -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        <!-- 作成日時 -->
        <div class="flex items-center gap-1 text-xs text-base-content/60">
          <Calendar class="w-4 h-4" />
          {formatDate(favorite.createdAt)}
        </div>
      </div>

      <!-- シェアボタン -->
      <div class="flex gap-1 ml-2">
        <ShareButton {favorite} onShare={handleShare} />
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

    <!-- フッター：パターンと削除ボタン -->
    <div class="flex justify-center items-center mt-2 relative">
      <span class="badge badge-outline badge-sm">{getPatternLabel(favorite.pattern)}</span>

      <!-- 削除ボタン -->
      <div class="absolute right-0">
        {#if isDeleting}
          <div class="flex gap-1">
            <button
              class="btn btn-error btn-xs"
              onclick={handleDelete}
              aria-label="削除を確認"
            >
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
    </div>
  </div>
</div>