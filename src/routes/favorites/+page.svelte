<script lang="ts">
import { Loader2 } from '@lucide/svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import FavoritesList from '$lib/components/favorites/FavoritesList.svelte';
import { loadDyes } from '$lib/stores/dyes';
import { t } from '$lib/translations';

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

function handleSelectFavorite() {
  // お気に入りが選択されたらピッカーページに遷移
  goto(resolve('/'));
}
</script>

<svelte:head>
  <title>{$t('page.favorites.title')}</title>
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center min-h-[400px]">
    <Loader2 class="size-8 animate-spin text-primary" />
  </div>
{:else}
  <FavoritesList onSelectFavorite={handleSelectFavorite} />
{/if}
