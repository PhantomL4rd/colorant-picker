<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import type { HistoryEntry } from '$lib/types';
import HistoryList from '$lib/components/HistoryList.svelte';
import { loadDyes } from '$lib/stores/dyes';

let isLoading = $state(true);

onMount(async () => {
  try {
    await loadDyes();
    isLoading = false;
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
    isLoading = false;
  }
});

function handleSelectHistory(entry: HistoryEntry) {
  // 履歴が選択されたらピッカーページに遷移
  goto(`${base}/`);
}
</script>

<svelte:head>
  <title>履歴 | カララントピッカー</title>
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center min-h-[400px]">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else}
  <HistoryList onSelectHistory={handleSelectHistory} />
{/if}
