<script lang="ts">
import { Trash2, X, Calendar, MousePointer } from '@lucide/svelte';
import type { Favorite } from '$lib/types';
import ShareButton from './ShareButton.svelte';
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
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1 min-w-0">
        <!-- 作成日時 -->
        <div class="flex items-center gap-1 text-xs text-base-content/60">
          <Calendar class="w-3 h-3" />
          {formatDate(favorite.createdAt)}
        </div>
      </div>

      <!-- 操作ボタン -->
      <div class="flex gap-1 ml-2">
        {#if isDeleting}
          <!-- 削除確認 -->
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
          <!-- 通常の操作ボタン -->
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
            style="background-color: {favorite.primaryDye.hex};"
            title={favorite.primaryDye.name}
          ></div>
          <div class="text-xs mt-1 truncate" title={favorite.primaryDye.name}>
            {favorite.primaryDye.name}
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

    <!-- 選択ボタンとシェアボタン -->
    <div class="flex gap-2">
      <button
        class="btn btn-primary btn-sm flex-1"
        onclick={handleSelect}
        disabled={isDeleting}
      >
        <MousePointer class="w-4 h-4" />
        この組み合わせを選択
      </button>
      <ShareButton {favorite} onShare={handleShare} />
    </div>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(favorite.pattern)}</span>
    </div>
  </div>
</div>