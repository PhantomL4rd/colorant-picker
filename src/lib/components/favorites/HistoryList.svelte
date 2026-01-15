<script lang="ts">
import { Clock, Shuffle } from '@lucide/svelte';
import { Palette } from '$lib/models/Palette';
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { historyStore, restoreFromHistory } from '$lib/stores/history';
import { t } from '$lib/translations';
import type { Favorite, HistoryEntry } from '$lib/types';
import * as Card from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';
import PaletteCard from '../palette/PaletteCard.svelte';
import ShareModal from '../share/ShareModal.svelte';

type PreviewColor = { hex: string; name: string };
type PreviewColors = [PreviewColor, PreviewColor, PreviewColor];

interface Props {
  onSelectHistory?: (entry: HistoryEntry) => void;
}

const { onSelectHistory }: Props = $props();

// ShareModal の状態管理
let shareModalOpen = $state(false);
let selectedEntryForShare = $state<HistoryEntry | null>(null);

// 履歴一覧（作成日時順、新しい順）
const historyEntries = $derived($historyStore);
const sortedHistory = $derived(
  historyEntries.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
);

// 件数
const historyCount = $derived(historyEntries.length);

// 履歴が選択された時の処理
function handleSelectHistory(entry: HistoryEntry) {
  try {
    // 履歴を復元（ピッカーに適用）
    restoreFromHistory(entry);

    // 親コンポーネントにも通知（タブ切り替えなど）
    onSelectHistory?.(entry);
  } catch (error) {
    console.error('履歴の復元に失敗しました:', error);
  }
}

// シェア機能
function handleShare(entry: HistoryEntry) {
  selectedEntryForShare = entry;
  shareModalOpen = true;
}

function closeShareModal() {
  shareModalOpen = false;
  selectedEntryForShare = null;
}

// ShareModal用にFavorite形式に変換（HistoryEntryとFavoriteは同じ構造）
const favoriteForShare = $derived<Favorite | null>(selectedEntryForShare);

// お気に入り一覧
const favorites = $derived($favoritesStore);

// プレビュー用のカラー情報を生成（翻訳適用）
function getPreviewColors(entry: HistoryEntry): PreviewColors {
  const palette = new Palette(entry.primaryDye, entry.suggestedDyes, entry.pattern);
  const primary = entry.primaryDye;
  const sub = palette.sub.dye;
  const accent = palette.accent.dye;
  return [
    { hex: primary.hex, name: $t(`dye.names.${primary.id}`) || primary.name },
    { hex: sub.hex, name: $t(`dye.names.${sub.id}`) || sub.name },
    { hex: accent.hex, name: $t(`dye.names.${accent.id}`) || accent.name },
  ];
}

// お気に入り済みかチェック
function isFavorited(entry: HistoryEntry): boolean {
  const palette = new Palette(entry.primaryDye, entry.suggestedDyes, entry.pattern);
  return palette.isIn(favorites);
}

// お気に入りに追加
function handleAddToFavorites(entry: HistoryEntry) {
  saveFavorite({
    primaryDye: entry.primaryDye,
    suggestedDyes: entry.suggestedDyes,
    pattern: entry.pattern,
  });
}
</script>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Clock class="size-5 text-primary" />
      <h1 class="text-xl font-bold">{$t('page.favorites.tabs.history')}</h1>
    </div>

    {#if historyCount > 0}
      <p class="text-muted-foreground text-sm">
        {historyCount} {$t('common.nav.history')}
      </p>
    {/if}
  </div>

  <!-- コンテンツ -->
  {#if sortedHistory.length === 0}
    <!-- 空状態 -->
    <Card.Root class="bg-muted shadow-md">
      <Card.Content class="text-center py-16">
        <div class="text-muted-foreground/40 mb-6">
          <Clock class="size-20 mx-auto mb-4" />
        </div>
        <h2 class="text-xl font-semibold mb-4 text-muted-foreground">
          {$t('page.favorites.empty.history')}
        </h2>
        <div class="mt-6">
          <Button href="/" size="sm" class="gap-2">
            <Shuffle class="size-4" />
            {$t('common.nav.picker')}
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- 履歴一覧 -->
    <div class="space-y-4">
      {#each sortedHistory as entry (entry.id)}
        <PaletteCard
          colors={getPreviewColors(entry)}
          pattern={entry.pattern}
          favoriteForShare={entry}
          createdAt={entry.createdAt}
          showFavoriteButton={true}
          isFavorited={isFavorited(entry)}
          onSelect={() => handleSelectHistory(entry)}
          onShare={() => handleShare(entry)}
          onFavorite={() => handleAddToFavorites(entry)}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- ShareModal -->
<ShareModal
  isOpen={shareModalOpen}
  favorite={favoriteForShare}
  onClose={closeShareModal}
/>

<style>
  /* スムーズなスクロール */
  .container {
    scroll-behavior: smooth;
  }

  /* 履歴項目のアニメーション */
  .space-y-4 > :global(*) {
    animation: fadeInUp 0.3s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
