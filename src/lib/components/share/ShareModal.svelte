<script lang="ts">
import { Check, Copy, Loader2 } from '@lucide/svelte';
import { Palette } from '$lib/models/Palette';
import { FEEDBACK_DURATION } from '$lib/constants/timing';
import { t } from '$lib/translations';
import type { Favorite } from '$lib/types';
import { copyToClipboard, generateShareUrl } from '$lib/utils/shareUtils';
import * as Dialog from '$lib/components/ui/dialog';
import { Button } from '$lib/components/ui/button';
import { Label } from '$lib/components/ui/label';
import { Textarea } from '$lib/components/ui/textarea';

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

// 染料名を翻訳
function getDyeName(dye: { id: string; name: string }): string {
  return $t(`dye.names.${dye.id}`) || dye.name;
}

// Paletteを使って役割順（メイン/サブ/アクセント）でアクセス
const palette = $derived.by(() => {
  if (!favorite) return null;
  return new Palette(favorite.primaryDye, favorite.suggestedDyes, favorite.pattern);
});

// シェアテキストを翻訳テンプレートから生成
const shareText = $derived.by(() => {
  if (!favorite || !shareUrl || !palette) return '';
  const patternName = $t(`pattern.${favorite.pattern}.name`);

  // テンプレートから置換（翻訳された染料名を使用）
  return $t('page.share.shareText')
    .replace('{main}', getDyeName(favorite.primaryDye))
    .replace('{sub}', getDyeName(palette.sub.dye))
    .replace('{accent}', getDyeName(palette.accent.dye))
    .replace('{pattern}', patternName)
    .replace('{url}', shareUrl);
});

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
</script>

<!-- モーダル -->
<Dialog.Root open={isOpen && !!favorite} onOpenChange={(open) => !open && onClose()}>
  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{$t('page.share.title')}</Dialog.Title>
    </Dialog.Header>

    <!-- パレットプレビュー（役割順: メイン → サブ → アクセント） -->
    {#if palette}
      <div class="mb-6">
        <div class="grid grid-cols-3 gap-4">
          {#each palette.ratio as { dye }}
            <div class="text-center min-w-0">
              <div
                class="w-full h-16 md:h-18 rounded-lg border-2 border-border"
                style="background-color: {dye.hex};"
                title={getDyeName(dye)}
              ></div>
              <div class="text-xs mt-1 text-balance truncate">{getDyeName(dye)}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- シェア用テキスト -->
    <div class="mb-6 space-y-2 min-w-0">
      <Label for="share-text" class="font-medium">{$t('page.share.shareTextLabel')}</Label>

      <Textarea
        id="share-text"
        class="h-32 resize-none min-w-0 break-all"
        readonly
        value={shareText}
        onclick={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target?.select();
        }}
      />

      {#if copyError}
        <p class="text-xs text-destructive">{copyError}</p>
      {/if}
    </div>

    <!-- ボタン群 -->
    <Dialog.Footer>
      <Button variant="outline" onclick={onClose}>
        {$t('common.action.close')}
      </Button>
      <Button
        onclick={handleCopy}
        disabled={iscopying || !shareText}
        variant={copySuccess ? 'default' : 'default'}
        class={copySuccess ? 'bg-liked hover:bg-liked/90' : ''}
      >
        {#if copySuccess}
          <Check class="size-4 mr-2" />
          {$t('page.share.copied')}
        {:else if iscopying}
          <Loader2 class="size-4 mr-2 animate-spin" />
          {$t('page.share.copying')}
        {:else}
          <Copy class="size-4 mr-2" />
          {$t('common.action.copy')}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
