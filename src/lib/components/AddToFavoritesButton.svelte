<script lang="ts">
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { selectionStore } from '$lib/stores/selection';
import { Palette } from '$lib/models/Palette';
import { Heart } from '@lucide/svelte';

interface Props {
  disabled?: boolean;
}

const { disabled = false }: Props = $props();

// 保存状態
let isSaving = $state(false);
let saveError = $state('');

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

  // 即座にお気に入りに追加（モーダルを表示せずに）
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

    // 成功を示すトーストを表示（モーダルなしで）
    showToast();
  } catch (error) {
    saveError = error instanceof Error ? error.message : 'スキ！の保存に失敗しました。';
    // エラーの場合はアラートで表示
    alert(saveError);
  } finally {
    isSaving = false;
  }
}

// 成功トーストを表示
function showToast() {
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-end z-50';
  toast.innerHTML = `
    <div class="alert alert-success">
      <span>スキ！しました！</span>
    </div>
  `;

  document.body.appendChild(toast);

  // 3秒後に削除
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
}
</script>

<!-- スキ！ボタン -->
{#if isAlreadyFavorited}
  <button
    class="btn btn-ghost btn-sm text-success cursor-default"
    disabled
    aria-label="スキ！済み"
  >
    <Heart class="w-4 h-4 fill-current" />
    スキ！済み
  </button>
{:else}
  <button
    class="btn btn-primary btn-sm"
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
{/if}