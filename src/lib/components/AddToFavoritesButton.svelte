<script lang="ts">
import { Heart } from 'lucide-svelte';
import { Palette } from '$lib/models/Palette';
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { selectionStore } from '$lib/stores/selection';
import HeartBurst, { type HeartBurstApi } from './HeartBurst.svelte';

interface Props {
  disabled?: boolean;
}

const { disabled = false }: Props = $props();

// 保存状態
let isSaving = $state(false);
let justSaved = $state(false);
let saveError = $state('');

// ハートバースト
let heartBurst: HeartBurstApi;

// 現在の選択状態
const currentSelection = $derived($selectionStore);

// お気に入り一覧
const favorites = $derived($favoritesStore);

// パレットを生成
const palette = $derived.by(() => {
  if (!currentSelection.primaryDye || !currentSelection.suggestedDyes) return null;
  return new Palette(
    currentSelection.primaryDye,
    currentSelection.suggestedDyes,
    currentSelection.pattern
  );
});

// 既にお気に入りに登録済みかチェック
const isAlreadyFavorited = $derived(palette?.isIn(favorites) ?? false);

// プライマリ染料が選択されていない場合、または既にお気に入り済みの場合は無効
const isDisabled = $derived(
  disabled || !currentSelection.primaryDye || !currentSelection.suggestedDyes || isAlreadyFavorited
);

function openModal() {
  if (isDisabled) return;
  handleSave();
}

function handleSave() {
  if (!currentSelection.primaryDye || !currentSelection.suggestedDyes) {
    saveError = '組み合わせが選択されていません。';
    return;
  }

  try {
    isSaving = true;
    saveError = '';

    saveFavorite({
      primaryDye: currentSelection.primaryDye,
      suggestedDyes: currentSelection.suggestedDyes,
      pattern: currentSelection.pattern,
    });

    // ハートバースト + ポップアニメーション
    heartBurst?.trigger();
    justSaved = true;
    setTimeout(() => {
      justSaved = false;
    }, 800);

    // 成功を示すトーストを表示
    showToast();
  } catch (error) {
    saveError = error instanceof Error ? error.message : 'スキ！の保存に失敗しました。';
    alert(saveError);
  } finally {
    isSaving = false;
  }
}

// 成功トーストを表示
function showToast() {
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-end z-50 animate-slide-in-right';
  toast.innerHTML = `
    <div class="alert alert-success gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span>スキ！しました</span>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease-out';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 200);
    }
  }, 2500);
}
</script>

<!-- スキ！ボタン -->
<div class="relative inline-block">
  <HeartBurst bind:this={heartBurst} />

  {#if justSaved}
    <!-- アニメーション中 -->
    <button
      class="btn btn-ghost btn-sm text-red-500 cursor-default"
      disabled
      aria-label="スキ！"
    >
      <Heart class="w-4 h-4 animate-heart-flip" fill="currentColor" />
      スキ！
    </button>
  {:else if isAlreadyFavorited}
    <button
      class="btn btn-ghost btn-sm text-success cursor-default"
      disabled
      aria-label="スキ！済み"
    >
      <Heart class="w-4 h-4 fill-current" />
      スキ！済み
    </button>
  {:else}
    <div class="tooltip tooltip-top tooltip-accent" class:tooltip-open={favorites.length === 0} data-tip="気に入ったら押してみて！">
      <button
        class="btn btn-primary btn-sm gap-1"
        class:btn-disabled={isDisabled}
        class:loading={isSaving}
        onclick={openModal}
        disabled={isDisabled || isSaving}
        aria-label="スキ！"
      >
        {#if isSaving}
          保存中...
        {:else}
          <Heart class="w-4 h-4" />
          スキ！
        {/if}
      </button>
    </div>
  {/if}
</div>
