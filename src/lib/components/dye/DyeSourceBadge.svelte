<script lang="ts">
import type { DyeSource } from '$lib/types';
import { t } from '$lib/translations';

interface Props {
  source: DyeSource | undefined;
}

const { source }: Props = $props();

const isVisible = $derived(source !== undefined && source !== 'normal');
</script>

{#if isVisible && source}
  <span
    class="inline-flex items-center rounded-sm bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 leading-none"
    title={$t(`dye.source.${source}.full`)}
  >
    {$t(`dye.source.${source}.label`)}
  </span>
{/if}
