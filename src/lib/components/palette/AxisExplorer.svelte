<script lang="ts">
import { Check, X } from '@lucide/svelte';
import { t } from '$lib/translations';
import type { DyeProps } from '$lib/types';
import { generateLadder, type LadderAxis } from '$lib/utils/color/axisNeighbors';

interface Props {
  baseDye: DyeProps;
  allDyes: DyeProps[];
  axis: LadderAxis;
  onPick: (dye: DyeProps) => void;
  onClose: () => void;
}

const { baseDye, allDyes, axis, onPick, onClose }: Props = $props();

const ladder = $derived(generateLadder(baseDye, allDyes, axis));

function getDyeName(d: DyeProps): string {
  return $t(`dye.names.${d.id}`) || d.name;
}

function textColor(d: DyeProps): string {
  return d.oklab.l > 0.6 ? '#0F172A' : '#FFFFFF';
}
</script>

<div class="bg-card border border-border rounded-2xl mt-2 overflow-hidden shadow-sm">
  <div class="flex justify-between items-center px-3 py-2 border-b border-border">
    <span class="text-xs font-medium text-muted-foreground">
      {$t(`page.palette.axisExplorer.title.${axis}`)}
    </span>
    <button
      type="button"
      class="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
      onclick={onClose}
      aria-label={$t('page.palette.axisExplorer.close')}
    >
      <X class="size-3.5" />
    </button>
  </div>

  <!-- 軸ラダー: 指定軸のターゲット値の昇順に並ぶ -->
  <ul class="flex flex-col max-h-[60vh] overflow-y-auto">
    {#each ladder as { dye, isBase } (`${dye.id}-${isBase}`)}
      <li>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 text-left transition-opacity hover:opacity-90 cursor-pointer"
          style="background-color: {dye.hex}; color: {textColor(dye)};"
          onclick={() => onPick(dye)}
          aria-current={isBase ? 'true' : undefined}
          aria-label={getDyeName(dye)}
        >
          {#if isBase}
            <Check class="size-3.5 flex-shrink-0" aria-hidden="true" />
          {:else}
            <span class="w-3.5 flex-shrink-0" aria-hidden="true"></span>
          {/if}
          <span class="flex-1 text-xs font-medium truncate">{getDyeName(dye)}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
