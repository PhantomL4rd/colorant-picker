<script lang="ts">
import { Layers } from '@lucide/svelte';
import * as Card from '$lib/components/ui/card';
import * as Popover from '$lib/components/ui/popover';
import { t } from '$lib/translations';
import type { DyeProps, KasaneIrome, TraditionalColor } from '$lib/types';

interface Props {
  item: KasaneIrome;
  colorById: Map<string, TraditionalColor>;
  dyes: DyeProps[];
}

const { item, colorById, dyes }: Props = $props();

const dyeById = $derived(new Map(dyes.map((d) => [d.id, d])));
const main = $derived(item.variants[0]);
const variantCount = $derived(item.variants.length);
const hasMultipleVariants = $derived(variantCount > 1);

function dyeForColor(colorId: string | undefined): DyeProps | null {
  if (!colorId) return null;
  const c = colorById.get(colorId);
  if (!c) return null;
  return dyeById.get(c.dyeId) ?? null;
}

function hexFor(colorId: string | undefined): string {
  const dye = dyeForColor(colorId);
  if (dye) return dye.hex;
  if (!colorId) return '#808080';
  return colorById.get(colorId)?.hex ?? '#808080';
}

function nameFor(colorId: string | undefined): string {
  const dye = dyeForColor(colorId);
  if (!dye) return 'Unknown';
  return $t(`dye.names.${dye.id}`) || dye.name;
}
</script>

<Card.Root class="shadow-sm relative">
  {#if hasMultipleVariants}
    <div class="absolute top-2 right-2 z-10">
      <Popover.Root>
        <Popover.Trigger
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={$t('page.kasane.variants.title').replace('{name}', item.name)}
        >
          <Layers class="size-3" />
          <span>{$t('page.kasane.variants.button')}</span>
          <span class="tabular-nums">{variantCount}</span>
        </Popover.Trigger>
        <Popover.Content side="bottom" align="end" class="w-80 p-3">
          <p class="text-sm font-semibold mb-2">
            {$t('page.kasane.variants.title').replace('{name}', item.name)}
          </p>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
            {#each item.variants as variant, i (i)}
              <div class="grid grid-cols-3 gap-2 rounded-md p-1.5 bg-muted/40">
                {#each [variant.omoteColor, variant.nakaColor, variant.uraColor] as cid, j (j)}
                  <div class="text-center min-w-0">
                    <div
                      class="w-full h-8 rounded border border-border"
                      style="background-color: {hexFor(cid)};"
                      title={nameFor(cid)}
                    ></div>
                    <p class="text-xs text-muted-foreground truncate mt-1" title={nameFor(cid)}>
                      {nameFor(cid)}
                    </p>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  {/if}

  <Card.Content class="p-3">
    <div class="text-center mb-2">
      <h3 class="font-bold text-base">{item.name}</h3>
      <p class="text-xs text-muted-foreground">{item.reading}</p>
    </div>

    {#if main}
      <div class="grid grid-cols-3 gap-2">
        {#each [main.omoteColor, main.nakaColor, main.uraColor] as cid, i (i)}
          <div class="text-center min-w-0">
            <div
              class="w-full h-12 rounded-lg border-2 border-border"
              style="background-color: {hexFor(cid)};"
              title={nameFor(cid)}
            ></div>
            <div class="text-xs mt-1 text-muted-foreground truncate" title={nameFor(cid)}>
              {nameFor(cid)}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
