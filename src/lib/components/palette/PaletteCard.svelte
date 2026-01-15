<script lang="ts">
import { Calendar, Heart, Loader2, Trash2, X } from '@lucide/svelte';
import { FEEDBACK_DURATION } from '$lib/constants/timing';
import { t } from '$lib/translations';
import type { Favorite, HarmonyPattern } from '$lib/types';
import * as Card from '$lib/components/ui/card';
import * as Alert from '$lib/components/ui/alert';
import { Button } from '$lib/components/ui/button';
import { Badge } from '$lib/components/ui/badge';
import HeartBurst, { type HeartBurstApi } from '../ui/HeartBurst.svelte';
import PaletteColorPreview from './PaletteColorPreview.svelte';
import ShareButton from '../share/ShareButton.svelte';

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
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return $t('page.palette.unknownDate');
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
    }, FEEDBACK_DURATION.BUTTON);
  } catch (err) {
    error = err instanceof Error ? err.message : $t('common.action.likeError');
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
      error = err instanceof Error ? err.message : $t('page.palette.deleteFailed');
      isDeleting = false;
    }
  }
}

function cancelDelete() {
  isDeleting = false;
}
</script>

<Card.Root class="transition-shadow hover:shadow-lg">
  <Card.Content class="p-4">
    <!-- ヘッダー部分：日時と操作ボタン -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex-1 min-w-0">
        {#if createdAt}
          <div class="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar class="size-4" />
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
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-red-500"
                disabled
                aria-label={$t('common.action.like')}
              >
                <Heart class="size-4 animate-heart-flip" fill="currentColor" />
              </Button>
            {:else if isFavorited}
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-green-500"
                disabled
                aria-label={$t('common.action.alreadyLiked')}
              >
                <Heart class="size-4 fill-current" />
              </Button>
            {:else}
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                onclick={handleFavorite}
                disabled={isAddingToFavorites}
                aria-label={$t('common.action.like')}
              >
                {#if isAddingToFavorites}
                  <Loader2 class="size-4 animate-spin" />
                {:else}
                  <Heart class="size-4" />
                {/if}
              </Button>
            {/if}
          </div>
        {/if}

        <ShareButton favorite={favoriteForShare} {onShare} />
      </div>
    </div>

    <!-- エラーメッセージ -->
    {#if error}
      <Alert.Root variant="destructive" class="mb-4 py-2">
        <Alert.Description class="text-xs">{error}</Alert.Description>
      </Alert.Root>
    {/if}

    <!-- カラープレビュー（クリックで選択） -->
    <div class="mb-4">
      <PaletteColorPreview {colors} {onSelect} />
    </div>

    <!-- フッター：パターンと削除ボタン -->
    <div class="flex justify-center items-center mt-2 relative">
      <Badge variant="outline">{$t(`pattern.${pattern}.name`)}</Badge>

      {#if showDeleteButton}
        <!-- 削除ボタン -->
        <div class="absolute right-0">
          {#if isDeleting}
            <div class="flex gap-1">
              <Button variant="destructive" size="sm" class="h-6 text-xs" onclick={handleDelete} aria-label={$t('page.palette.confirmDelete')}>
                {$t('page.palette.delete')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-6"
                onclick={cancelDelete}
                aria-label={$t('page.palette.cancelDelete')}
              >
                <X class="size-3" />
              </Button>
            </div>
          {:else}
            <Button
              variant="ghost"
              size="icon"
              class="size-6"
              onclick={handleDelete}
              aria-label={$t('page.palette.delete')}
            >
              <Trash2 class="size-3 text-destructive" />
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
