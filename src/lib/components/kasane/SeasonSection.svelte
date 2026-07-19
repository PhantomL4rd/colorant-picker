<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { t } from '$lib/translations';
  import type { DyeProps, KasaneIrome, KasaneSeason, TraditionalColor } from '$lib/types';
  import KasaneCard from './KasaneCard.svelte';

  interface Props {
    season: KasaneSeason;
    items: KasaneIrome[];
    dyes: DyeProps[];
    colorById: Map<string, TraditionalColor>;
    isExpanded: boolean;
    onToggle: () => void;
  }

  const { season, items, dyes, colorById, isExpanded, onToggle }: Props = $props();

  function findDyeById(id: string): DyeProps | null {
    return dyes.find((d) => d.id === id) ?? null;
  }

  function dyeForColor(colorId: string): DyeProps | null {
    const color = colorById.get(colorId);
    if (!color) return null;
    return findDyeById(color.dyeId);
  }
</script>

<Collapsible.Root open={isExpanded} onOpenChange={onToggle} class="mb-2">
  <Collapsible.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        class="flex w-full items-center justify-between rounded-lg bg-muted px-4 py-3 hover:bg-muted/80 transition-colors cursor-pointer"
      >
        <h2 class="font-bold text-lg">
          {$t(`page.kasane.season.${season}`)}
          <span class="text-sm font-normal text-muted-foreground ml-2">({items.length})</span>
        </h2>
        <ChevronDown
          class="size-4 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
        />
      </button>
    {/snippet}
  </Collapsible.Trigger>
  <Collapsible.Content>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
      {#each items as item (item.id)}
        {@const main = item.variants[0]}
        <KasaneCard
          name={item.name}
          reading={item.reading}
          omoteDye={main ? dyeForColor(main.omoteColor) : null}
          uraDye={main ? dyeForColor(main.uraColor) : null}
          variants={item.variants}
          {colorById}
          {dyes}
        />
      {/each}
    </div>
  </Collapsible.Content>
</Collapsible.Root>
