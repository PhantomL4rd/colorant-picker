<script lang="ts">
import { Check, Copy, X } from '@lucide/svelte';
import { Palette } from '$lib/models/Palette';
import { FEEDBACK_DURATION } from '$lib/constants/timing';
import { t } from '$lib/translations';
import type { Favorite } from '$lib/types';
import { copyToClipboard, generateShareUrl } from '$lib/utils/shareUtils';
import CombinationPreview from './CombinationPreview.svelte';

interface Props {
  isOpen: boolean;
  favorite: Favorite | null;
  onClose: () => void;
}

const { isOpen, favorite, onClose }: Props = $props();

let copySuccess = $state(false);
let copyError = $state('');
let iscopying = $state(false);

// シェア用データの計算
const shareUrl = $derived(favorite ? generateShareUrl(favorite) : '');

// シェアテキストを翻訳テンプレートから生成
const shareText = $derived.by(() => {
  if (!favorite || !shareUrl) return '';
  const palette = new Palette(favorite.primaryDye, favorite.suggestedDyes, favorite.pattern);
  const patternName = $t(`pattern.${favorite.pattern}.name`);

  // テンプレートから置換
  return $t('page.share.shareText')
    .replace('{main}', favorite.primaryDye.name)
    .replace('{sub}', palette.sub.dye.name)
    .replace('{accent}', palette.accent.dye.name)
    .replace('{pattern}', patternName)
    .replace('{url}', shareUrl);
});

// 個別のderived変数でアクセス（関数構文なし）
const primaryDye = $derived(favorite?.primaryDye || null);
const suggestedDyes = $derived(favorite?.suggestedDyes || []);
const suggestedDye1 = $derived(suggestedDyes[0] || null);
const suggestedDye2 = $derived(suggestedDyes[1] || null);

// コピー機能
async function handleCopy() {
  if (!shareText || iscopying) return;

  iscopying = true;
  copyError = '';
  copySuccess = false;

  try {
    const success = await copyToClipboard(shareText);
    if (success) {
      copySuccess = true;
      // リセット
      setTimeout(() => {
        copySuccess = false;
      }, FEEDBACK_DURATION.COPY_SUCCESS);
    } else {
      copyError = $t('page.share.copyFailed');
    }
  } catch (error) {
    copyError = $t('page.share.copyFailed');
  } finally {
    iscopying = false;
  }
}

// モーダル外クリック時の処理
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}

// Escapeキーでモーダルを閉じる
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    onClose();
  }
}
</script>

<!-- モーダル -->
{#if isOpen && favorite}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog
    class="modal modal-open"
    onkeydown={handleKeydown}
    aria-labelledby="share-modal-title"
    aria-describedby="share-modal-description"
  >
    <div class="modal-box w-11/12 max-w-2xl">
        <!-- ヘッダー -->
        <div class="flex items-center justify-between mb-6">
          <h3 id="share-modal-title" class="text-lg font-bold">{$t('page.share.title')}</h3>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onclick={onClose}
            aria-label={$t('common.action.close')}
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- パレットプレビュー -->
        <div class="mb-6">
          <div class="grid grid-cols-3 gap-4">
            <!-- 主色 -->
            {#if primaryDye}
              <div class="text-center">
                <div
                  class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300"
                  style="background-color: {primaryDye.hex};"
                  title={primaryDye.name}
                ></div>
                <div class="text-xs mt-1 text-balance">{primaryDye.name}</div>
              </div>
            {/if}

            <!-- 提案色1 -->
            {#if suggestedDye1}
              <div class="text-center">
                <div
                  class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300"
                  style="background-color: {suggestedDye1.hex};"
                  title={suggestedDye1.name}
                ></div>
                <div class="text-xs mt-1 text-balance">{suggestedDye1.name}</div>
              </div>
            {/if}

            <!-- 提案色2 -->
            {#if suggestedDye2}
              <div class="text-center">
                <div
                  class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300"
                  style="background-color: {suggestedDye2.hex};"
                  title={suggestedDye2.name}
                ></div>
                <div class="text-xs mt-1 text-balance">{suggestedDye2.name}</div>
              </div>
            {/if}
          </div>
        </div>

        <!-- シェア用テキスト -->
        <div class="mb-6">
          <label for="share-text" class="label">
            <span class="label-text font-medium">{$t('page.share.shareTextLabel')}</span>
          </label>
          
          <textarea
            id="share-text"
            class="textarea textarea-bordered w-full h-32 resize-none text-base-content"
            readonly
            value={shareText}
            onclick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target?.select();
            }}
          ></textarea>
          
          {#if copyError}
            <div class="label">
              <span class="label-text-alt text-error">{copyError}</span>
            </div>
          {/if}
        </div>

        <!-- ボタン群 -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-soft"
            onclick={onClose}
          >
            {$t('common.action.close')}
          </button>
          <button
            type="button"
            class="btn btn-primary gap-2"
            onclick={handleCopy}
            disabled={iscopying || !shareText}
            class:btn-success={copySuccess}
          >
            {#if copySuccess}
              <Check class="w-4 h-4" />
              {$t('page.share.copied')}
            {:else if iscopying}
              <span class="loading loading-spinner loading-xs"></span>
              {$t('page.share.copying')}
            {:else}
              <Copy class="w-4 h-4" />
              {$t('common.action.copy')}
            {/if}
          </button>
        </div>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={onClose}></div>
  </dialog>
{/if}