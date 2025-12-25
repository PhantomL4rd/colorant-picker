<script lang="ts">
import { Clock, Shuffle } from '@lucide/svelte';
import { Palette } from '$lib/models/Palette';
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { historyStore, restoreFromHistory } from '$lib/stores/history';
import type { Favorite, HistoryEntry } from '$lib/types';
import PaletteCard from './PaletteCard.svelte';
import ShareModal from './ShareModal.svelte';

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

// プレビュー用のカラー情報を生成
function getPreviewColors(entry: HistoryEntry): PreviewColors {
  const palette = new Palette(entry.primaryDye, entry.suggestedDyes, entry.pattern);
  return [
    { hex: entry.primaryDye.hex, name: entry.primaryDye.name },
    { hex: palette.sub.dye.hex, name: palette.sub.dye.name },
    { hex: palette.accent.dye.hex, name: palette.accent.dye.name },
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
      <Clock class="w-5 h-5 text-primary" />
      <h1 class="text-xl font-bold">履歴</h1>
    </div>

    {#if historyCount > 0}
      <p class="text-base-content/60 text-sm">
        最新{historyCount}件の組み合わせ履歴
      </p>
    {/if}
  </div>

  <!-- コンテンツ -->
  {#if sortedHistory.length === 0}
    <!-- 空状態 -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body text-center py-16">
        <div class="text-base-content/40 mb-6">
          <Clock class="w-20 h-20 mx-auto mb-4" />
        </div>
        <h2 class="text-xl font-semibold mb-4 text-base-content/70">
          まだ履歴がありません
        </h2>
        <div class="text-base-content/60 space-y-2">
          <p>カララントピッカーで色を選択すると、</p>
          <p>組み合わせが自動的に記録されます。</p>
        </div>
        <div class="mt-6">
          <a href="/" class="btn btn-primary btn-sm gap-2">
            <Shuffle class="w-4 h-4" />
            配色を探しに行く
          </a>
        </div>
      </div>
    </div>
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
