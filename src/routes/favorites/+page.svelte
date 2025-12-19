<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { Heart, Clock } from 'lucide-svelte';
import FavoritesList from '$lib/components/FavoritesList.svelte';
import HistoryList from '$lib/components/HistoryList.svelte';
import { loadDyes } from '$lib/stores/dyes';

let isLoading = $state(true);

// URLハッシュからタブを取得 (#history があれば履歴タブ)
let activeTab = $state<'favorites' | 'history'>('favorites');

onMount(async () => {
  try {
    await loadDyes();
    // ハッシュから初期タブを設定
    if (window.location.hash === '#history') {
      activeTab = 'history';
    }
    isLoading = false;
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
    isLoading = false;
  }
});

// ハッシュ変更を監視
$effect(() => {
  const handleHashChange = () => {
    activeTab = window.location.hash === '#history' ? 'history' : 'favorites';
  };
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
});

function setTab(tab: 'favorites' | 'history') {
  activeTab = tab;
  window.location.hash = tab === 'history' ? '#history' : '';
}

function handleSelectFavorite() {
  // お気に入りが選択されたらピッカーページに遷移
  goto(`${base}/`);
}

function handleSelectHistory() {
  // 履歴が選択されたらピッカーページに遷移
  goto(`${base}/`);
}
</script>

<svelte:head>
  <title>{activeTab === 'history' ? '履歴' : 'スキ！'} | カララントピッカー</title>
</svelte:head>

<!-- サブタブナビゲーション -->
<div class="tabs tabs-boxed mb-4 justify-center">
  <button
    class="tab tab-lg gap-2"
    class:tab-active={activeTab === 'favorites'}
    onclick={() => setTab('favorites')}
  >
    <Heart class="w-5 h-5" />
    スキ！
  </button>
  <button
    class="tab tab-lg gap-2"
    class:tab-active={activeTab === 'history'}
    onclick={() => setTab('history')}
  >
    <Clock class="w-5 h-5" />
    履歴
  </button>
</div>

{#if isLoading}
  <div class="flex justify-center items-center min-h-[400px]">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else if activeTab === 'favorites'}
  <FavoritesList onSelectFavorite={handleSelectFavorite} />
{:else}
  <HistoryList onSelectHistory={handleSelectHistory} />
{/if}
