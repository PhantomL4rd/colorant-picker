<script lang="ts">
import { ChevronDown, ExternalLink, Layers, Loader2 } from '@lucide/svelte';
import { onMount } from 'svelte';
import KasaneCard3 from '$lib/components/kasane/KasaneCard3.svelte';
import SeasonSection from '$lib/components/kasane/SeasonSection.svelte';
import * as Alert from '$lib/components/ui/alert';
import * as Collapsible from '$lib/components/ui/collapsible';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import { t } from '$lib/translations';
import type {
  KasaneData,
  KasaneIrome,
  KasaneSeason,
  TraditionalColor,
  TraditionalColorData,
} from '$lib/types';

const SEASONS: KasaneSeason[] = ['spring', 'summer', 'autumn', 'winter', 'misc'];

function currentSeason(): KasaneSeason {
  const m = new Date().getMonth() + 1;
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

let kasaneData: KasaneIrome[] = $state([]);
let kasaneThree: KasaneIrome[] = $state([]);
let traditionalColors: TraditionalColor[] = $state([]);
let isLoading = $state(true);
let error: string | null = $state(null);
let expandedSeasons = $state<Set<KasaneSeason>>(new Set([currentSeason()]));
let isThreeExpanded = $state(false);

const colorById = $derived(new Map(traditionalColors.map((c) => [c.id, c])));

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
    const [kasaneRes, threeRes, colorsRes] = await Promise.all([
      fetch(`${basePath}data/kasane.json`),
      fetch(`${basePath}data/kasane-three.json`),
      fetch(`${basePath}data/traditional-colors.json`),
    ]);
    if (!kasaneRes.ok) throw new Error('Failed to load kasane data');
    if (!colorsRes.ok) throw new Error('Failed to load traditional colors data');
    const data: KasaneData = await kasaneRes.json();
    const colorsData: TraditionalColorData = await colorsRes.json();
    traditionalColors = colorsData.colors;
    // 異説が同一カララントに帰着する場合は先頭以外を畳む（dyeId 同値で dedup）
    const dyeOf = new Map(colorsData.colors.map((c) => [c.id, c.dyeId]));
    const dedupByDye = (k: KasaneIrome): KasaneIrome => {
      const seen = new Set<string>();
      const variants = k.variants.filter((v) => {
        const key = `${dyeOf.get(v.omoteColor)}|${dyeOf.get(v.nakaColor ?? '')}|${dyeOf.get(v.uraColor)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...k, variants };
    };
    kasaneData = data.kasane.filter((k) => !k.hidden).map(dedupByDye);
    // 3色重ねは別ファイル。読み込み失敗は致命ではないので無視
    if (threeRes.ok) {
      const threeData: KasaneData = await threeRes.json();
      kasaneThree = threeData.kasane.filter((k) => !k.hidden).map(dedupByDye);
    }
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
          {colorById}
          isExpanded={expandedSeasons.has(season)}
          onToggle={() => toggleSeason(season)}
        />
      {/each}
      {#if kasaneThree.length > 0}
        <Collapsible.Root
          open={isThreeExpanded}
          onOpenChange={(v) => (isThreeExpanded = v)}
          class="mb-2"
        >
          <Collapsible.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                class="flex w-full items-center justify-between rounded-lg bg-muted px-4 py-3 hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <h2 class="font-bold text-lg">
                  {$t('page.kasane.three.heading')}
                  <span class="text-sm font-normal text-muted-foreground ml-2"
                    >({kasaneThree.length})</span
                  >
                </h2>
                <ChevronDown
                  class="size-4 transition-transform duration-200 {isThreeExpanded
                    ? 'rotate-180'
                    : ''}"
                />
              </button>
            {/snippet}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
              {#each kasaneThree as item (item.id)}
                <KasaneCard3 {item} {colorById} dyes={$dyeStore} />
              {/each}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      {/if}
      <p class="mt-8 text-center text-[10px] text-muted-foreground/60">
        {$t('page.kasane.credit.reference')}: {$t('page.kasane.credit.source')}
      </p>
    </div>
  {/if}
</div>
