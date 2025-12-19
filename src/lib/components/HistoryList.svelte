<script lang="ts">
import { Clock, Shuffle } from '@lucide/svelte';
import type { HistoryEntry, Favorite } from '$lib/types';
import { historyStore, restoreFromHistory } from '$lib/stores/history';
import HistoryItem from './HistoryItem.svelte';
import ShareModal from './ShareModal.svelte';

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

// 履歴エントリをお気に入り形式に変換（ShareModal用）
function formatEntryDate(dateStr: string): string {
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

// ShareModal用にFavorite形式に変換
const favoriteForShare = $derived<Favorite | null>(
  selectedEntryForShare
    ? {
        ...selectedEntryForShare,
        name: formatEntryDate(selectedEntryForShare.createdAt),
      }
    : null
);
</script>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Clock class="w-6 h-6 text-primary" />
      <h1 class="text-2xl font-bold">履歴</h1>
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
          <div class="badge badge-outline">
            <Shuffle class="w-3 h-3 mr-1" />
            ピッカータブで組み合わせを探してみましょう
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- 履歴一覧 -->
    <div class="space-y-4">
      {#each sortedHistory as entry (entry.id)}
        <HistoryItem
          {entry}
          onSelect={handleSelectHistory}
          onShare={handleShare}
        />
      {/each}
    </div>

    <!-- ページ下部の余白確保メッセージ -->
    {#if historyCount >= 5}
      <div class="text-center mt-8 mb-4">
        <p class="text-base-content/40 text-sm">
          最新{historyCount}件を表示中（最大10件まで保持）
        </p>
      </div>
    {/if}
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
