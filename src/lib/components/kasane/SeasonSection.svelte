<script lang="ts">
  import { t } from '$lib/translations';
  import type { KasaneIrome, KasaneSeason, DyeProps } from '$lib/types';
  import KasaneCard from './KasaneCard.svelte';

  interface Props {
    season: KasaneSeason;
    items: KasaneIrome[];
    dyes: DyeProps[];
    isExpanded: boolean;
    onToggle: () => void;
  }

  const { season, items, dyes, isExpanded, onToggle }: Props = $props();

  function findDyeById(id: string): DyeProps | null {
    return dyes.find((d) => d.id === id) ?? null;
  }
</script>

<div class="collapse collapse-arrow bg-base-200 mb-2">
  <input
    type="checkbox"
    checked={isExpanded}
    onchange={onToggle}
    aria-label={$t(`page.kasane.season.${season}`)}
  />
  <h2 class="collapse-title font-bold text-lg">
    {$t(`page.kasane.season.${season}`)}
    <span class="text-sm font-normal text-base-content/60 ml-2">({items.length})</span>
  </h2>
  <div class="collapse-content">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
      {#each items as item (item.id)}
        <KasaneCard
          name={item.name}
          reading={item.reading}
          omoteDye={findDyeById(item.omote)}
          uraDye={findDyeById(item.ura)}
        />
      {/each}
    </div>
  </div>
</div>
