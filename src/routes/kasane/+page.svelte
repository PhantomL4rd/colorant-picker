<script lang="ts">
import { onMount } from 'svelte';
import { ExternalLink, Layers, Loader2 } from '@lucide/svelte';
import { t } from '$lib/translations';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import SeasonSection from '$lib/components/kasane/SeasonSection.svelte';
import type { KasaneData, KasaneIrome, KasaneSeason } from '$lib/types';
import * as Alert from '$lib/components/ui/alert';
const SEASONS: KasaneSeason[] = ['spring', 'summer', 'autumn', 'winter', 'misc'];

let kasaneData: KasaneIrome[] = $state([]);
let isLoading = $state(true);
let error: string | null = $state(null);
let expandedSeasons = $state<Set<KasaneSeason>>(new Set(['spring']));

const groupedBySeasons = $derived(
  SEASONS.map((season) => ({
    season,
    items: kasaneData.filter((k) => k.season === season),
  }))
);

function toggleSeason(season: KasaneSeason) {
  const newSet = new Set(expandedSeasons);
  if (newSet.has(season)) {
    newSet.delete(season);
  } else {
    newSet.add(season);
  }
  expandedSeasons = newSet;
}

onMount(async () => {
  try {
    await loadDyes();

    const basePath = import.meta.env.BASE_URL || '';
    const res = await fetch(`${basePath}data/kasane.json`);
    if (!res.ok) throw new Error('Failed to load kasane data');
    const data: KasaneData = await res.json();
    // hidden: true のエントリを除外（色差が大きいため非表示）
    kasaneData = data.kasane.filter((k) => !k.hidden);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    isLoading = false;
  }
});
</script>

<svelte:head>
  <title>{$t('page.kasane.title')}</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-6xl">
  <header class="mb-6">
    <h1 class="text-xl font-bold mb-2 flex items-center gap-2">
      <Layers class="size-6" />
      {$t('page.kasane.heading')}
    </h1>
    <p class="text-sm text-muted-foreground whitespace-pre-line">{$t('page.kasane.description')}</p>
  </header>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <Loader2 class="size-8 animate-spin text-primary" />
    </div>
  {:else if error}
    <Alert.Root variant="destructive">
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {:else}
    <div class="space-y-2">
      {#each groupedBySeasons as { season, items } (season)}
        <SeasonSection
          {season}
          {items}
          dyes={$dyeStore}
          isExpanded={expandedSeasons.has(season)}
          onToggle={() => toggleSeason(season)}
        />
      {/each}
    </div>

    <footer class="mt-8 p-4 text-xs">
      <p class="text-foreground">
        {$t('page.kasane.credit.reference')}:
        <a
          href="http://www.kariginu.jp/kikata/kasane-irome.htm"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-primary inline-flex items-center gap-1"
        >
          {$t('page.kasane.credit.source')}
          <ExternalLink class="size-3" />
        </a>
      </p>
    </footer>
  {/if}
</div>
