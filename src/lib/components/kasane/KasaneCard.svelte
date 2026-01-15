<script lang="ts">
import { BookOpenText } from '@lucide/svelte';
import { t, locale, type Locale } from '$lib/translations';
import { getLodestoneUrl } from '$lib/utils/i18n';
import type { DyeProps } from '$lib/types';
import * as Card from '$lib/components/ui/card';

interface Props {
  name: string;
  reading: string;
  omoteDye: DyeProps | null;
  uraDye: DyeProps | null;
}

const { name, reading, omoteDye, uraDye }: Props = $props();

const currentLocale = $derived($locale as Locale);

const omoteHex = $derived(omoteDye?.hex ?? '#808080');
const uraHex = $derived(uraDye?.hex ?? '#808080');
const omoteName = $derived(omoteDye ? $t(`dye.names.${omoteDye.id}`) || omoteDye.name : 'Unknown');
const uraName = $derived(uraDye ? $t(`dye.names.${uraDye.id}`) || uraDye.name : 'Unknown');

function getDyeLodestoneUrl(dye: DyeProps | null): string | undefined {
  if (!dye?.lodestone) return undefined;
  return getLodestoneUrl(dye.lodestone, currentLocale);
}
</script>

<Card.Root
  class="shadow-sm"
  aria-label="{name}（{reading}）: {$t('page.kasane.label.omote')} {omoteName}, {$t('page.kasane.label.ura')} {uraName}"
>
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
          {#if getDyeLodestoneUrl(omoteDye)}
            <a
              href={getDyeLodestoneUrl(omoteDye)}
              class="hover:text-primary transition-colors inline-flex items-center justify-center gap-0.5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpenText class="size-3 flex-shrink-0" />
              <span class="truncate">{omoteName}</span>
            </a>
          {:else}
            {omoteName}
          {/if}
        </div>
      </div>

      <div class="text-center">
        <div
          class="w-full h-12 rounded-lg border-2 border-border"
          style="background-color: {uraHex};"
          title={uraName}
        ></div>
        <div class="text-xs mt-1 text-muted-foreground truncate" title={uraName}>
          {#if getDyeLodestoneUrl(uraDye)}
            <a
              href={getDyeLodestoneUrl(uraDye)}
              class="hover:text-primary transition-colors inline-flex items-center justify-center gap-0.5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpenText class="size-3 flex-shrink-0" />
              <span class="truncate">{uraName}</span>
            </a>
          {:else}
            {uraName}
          {/if}
        </div>
      </div>
    </div>
  </Card.Content>
</Card.Root>
