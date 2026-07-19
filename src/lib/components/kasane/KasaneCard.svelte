<script lang="ts">
  import { Layers } from '@lucide/svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';
  import { t } from '$lib/translations';
  import type { DyeProps, KasaneVariant, TraditionalColor } from '$lib/types';

  interface Props {
    name: string;
    reading: string;
    omoteDye: DyeProps | null;
    uraDye: DyeProps | null;
    variants: KasaneVariant[];
    colorById: Map<string, TraditionalColor>;
    dyes: DyeProps[];
  }

  const { name, reading, omoteDye, uraDye, variants, colorById, dyes }: Props = $props();

  const omoteHex = $derived(omoteDye?.hex ?? '#808080');
  const uraHex = $derived(uraDye?.hex ?? '#808080');
  const omoteName = $derived(
    omoteDye ? $t(`dye.names.${omoteDye.id}`) || omoteDye.name : 'Unknown'
  );
  const uraName = $derived(uraDye ? $t(`dye.names.${uraDye.id}`) || uraDye.name : 'Unknown');

  const hasMultipleVariants = $derived(variants.length > 1);
  const variantCount = $derived(variants.length);

  const dyeById = $derived(new Map(dyes.map((d) => [d.id, d])));

  function dyeForColor(colorId: string): DyeProps | null {
    const color = colorById.get(colorId);
    if (!color) return null;
    return dyeById.get(color.dyeId) ?? null;
  }

  function dyeDisplayName(dye: DyeProps | null): string {
    if (!dye) return 'Unknown';
    return $t(`dye.names.${dye.id}`) || dye.name;
  }
</script>

<Card.Root
  class="shadow-sm relative"
  aria-label="{name}（{reading}）: {$t('page.kasane.label.omote')} {omoteName}, {$t(
    'page.kasane.label.ura'
  )} {uraName}"
>
  {#if hasMultipleVariants}
    <div class="absolute top-2 right-2 z-10">
      <Popover.Root>
        <Popover.Trigger
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={$t('page.kasane.variants.title').replace('{name}', name)}
        >
          <Layers class="size-3" />
          <span>{$t('page.kasane.variants.button')}</span>
          <span class="tabular-nums">{variantCount}</span>
        </Popover.Trigger>
        <Popover.Content side="bottom" align="end" class="w-80 p-3">
          <p class="text-sm font-semibold mb-2">
            {$t('page.kasane.variants.title').replace('{name}', name)}
          </p>
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
            {#each variants as variant, i (i)}
              {@const vOmoteDye = dyeForColor(variant.omoteColor)}
              {@const vUraDye = dyeForColor(variant.uraColor)}
              {@const vOmoteHex =
                vOmoteDye?.hex ?? colorById.get(variant.omoteColor)?.hex ?? '#808080'}
              {@const vUraHex = vUraDye?.hex ?? colorById.get(variant.uraColor)?.hex ?? '#808080'}
              <div class="grid grid-cols-2 gap-2 rounded-md p-1.5 bg-muted/40">
                <div class="text-center min-w-0">
                  <div
                    class="w-full h-8 rounded border border-border"
                    style="background-color: {vOmoteHex};"
                    title={dyeDisplayName(vOmoteDye)}
                  ></div>
                  <p
                    class="text-xs text-muted-foreground truncate mt-1"
                    title={dyeDisplayName(vOmoteDye)}
                  >
                    {dyeDisplayName(vOmoteDye)}
                  </p>
                </div>
                <div class="text-center min-w-0">
                  <div
                    class="w-full h-8 rounded border border-border"
                    style="background-color: {vUraHex};"
                    title={dyeDisplayName(vUraDye)}
                  ></div>
                  <p
                    class="text-xs text-muted-foreground truncate mt-1"
                    title={dyeDisplayName(vUraDye)}
                  >
                    {dyeDisplayName(vUraDye)}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  {/if}

  <Card.Content class="p-3">
    <div class="text-center mb-2">
      <h3 class="font-bold text-base">{name}</h3>
      <p class="text-xs text-muted-foreground">{reading}</p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="text-center">
        <div
          class="w-full h-12 rounded-lg border-2 border-border"
          style="background-color: {omoteHex};"
          title={omoteName}
        ></div>
        <div class="text-xs mt-1 text-muted-foreground truncate" title={omoteName}>
          {omoteName}
        </div>
      </div>

      <div class="text-center">
        <div
          class="w-full h-12 rounded-lg border-2 border-border"
          style="background-color: {uraHex};"
          title={uraName}
        ></div>
        <div class="text-xs mt-1 text-muted-foreground truncate" title={uraName}>
          {uraName}
        </div>
      </div>
    </div>
  </Card.Content>
</Card.Root>
