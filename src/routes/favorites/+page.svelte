<script lang="ts">
import { Clock, Heart } from 'lucide-svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import FavoritesList from '$lib/components/FavoritesList.svelte';
import HistoryList from '$lib/components/HistoryList.svelte';
import { loadDyes } from '$lib/stores/dyes';
import { t } from '$lib/translations';

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
  goto(resolve('/'));
}

function handleSelectHistory() {
  // 履歴が選択されたらピッカーページに遷移
  goto(resolve('/'));
}
</script>

<svelte:head>
  <title>{$t('page.favorites.title')}</title>
</svelte:head>

<!-- サブタブナビゲーション -->
<div class="flex justify-center mb-4 px-4">
  <div class="inline-flex bg-base-200 rounded-xl p-1 shadow-md">
    <button
      class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 {activeTab === 'favorites' ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-300'}"
      onclick={() => setTab('favorites')}
    >
      <Heart class="w-5 h-5" />
      {$t('page.favorites.tabs.favorites')}
    </button>
    <button
      class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 {activeTab === 'history' ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-300'}"
      onclick={() => setTab('history')}
    >
      <Clock class="w-5 h-5" />
      {$t('page.favorites.tabs.history')}
    </button>
  </div>
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
