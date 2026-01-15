<script lang="ts">
import { Heart, Loader2 } from '@lucide/svelte';
import { Palette } from '$lib/models/Palette';
import { FEEDBACK_DURATION, TOAST_TIMING } from '$lib/constants/timing';
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { selectionStore } from '$lib/stores/selection';
import { t } from '$lib/translations';
import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import HeartBurst, { type HeartBurstApi } from '../ui/HeartBurst.svelte';

interface Props {
  disabled?: boolean;
}

const { disabled = false }: Props = $props();

// 保存状態
let isSaving = $state(false);
let justSaved = $state(false);
let saveError = $state('');

// トースト表示状態
let showSuccessToast = $state(false);
let toastFading = $state(false);

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
    }, FEEDBACK_DURATION.BUTTON);

    // 成功を示すトーストを表示
    showToast();
  } catch (error) {
    saveError = error instanceof Error ? error.message : $t('common.action.likeError');
    alert(saveError);
  } finally {
    isSaving = false;
  }
}

// 成功トーストを表示（Svelte状態管理ベース）
function showToast() {
  showSuccessToast = true;
  toastFading = false;

  setTimeout(() => {
    toastFading = true;
    setTimeout(() => {
      showSuccessToast = false;
      toastFading = false;
    }, TOAST_TIMING.FADE_DURATION);
  }, TOAST_TIMING.DISPLAY_DURATION);
}
</script>

<!-- Like button -->
<div class="relative inline-block">
  <HeartBurst bind:this={heartBurst} />

  {#if justSaved}
    <!-- アニメーション中 -->
    <Button
      variant="ghost"
      size="sm"
      class="text-red-500 cursor-default"
      disabled
      aria-label={$t('common.action.like')}
    >
      <Heart class="size-4 animate-heart-flip" fill="currentColor" />
      {$t('common.action.like')}
    </Button>
  {:else if isAlreadyFavorited}
    <Button
      variant="ghost"
      size="sm"
      class="text-green-500 cursor-default"
      disabled
      aria-label={$t('common.action.alreadyLiked')}
    >
      <Heart class="size-4 fill-current" />
      {$t('common.action.alreadyLiked')}
    </Button>
  {:else}
    <Tooltip.Root open={favorites.length === 0 ? true : undefined}>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            size="sm"
            class="gap-1"
            onclick={openModal}
            disabled={isDisabled || isSaving}
            aria-label={$t('common.action.like')}
          >
            {#if isSaving}
              <Loader2 class="size-4 animate-spin" />
            {:else}
              <Heart class="size-4" />
              {$t('common.action.like')}
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>
        <p>{$t('common.action.like')}</p>
      </Tooltip.Content>
    </Tooltip.Root>
  {/if}
</div>

<!-- 成功トースト -->
{#if showSuccessToast}
  <div
    class="fixed top-4 right-4 z-50 animate-slide-in-right"
    class:opacity-0={toastFading}
    class:transition-opacity={toastFading}
    class:duration-300={toastFading}
  >
    <div class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg dark:border-green-800 dark:bg-green-950 dark:text-green-200">
      <Heart class="size-5 fill-current" />
      <span>{$t('common.action.liked')}</span>
    </div>
  </div>
{/if}
