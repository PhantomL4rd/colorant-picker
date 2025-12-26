<script lang="ts">
import { Shuffle } from '@lucide/svelte';
import { t } from '$lib/translations';
import type { DyeProps } from '$lib/types';

interface Props {
  dyes: DyeProps[];
  onRandomPick: (dyes: [DyeProps, DyeProps, DyeProps]) => void;
  disabled?: boolean;
}

const { dyes, onRandomPick, disabled = false }: Props = $props();

function handleRandomPick() {
  if (dyes.length < 3) return;

  // ランダムに3色選択
  const shuffled = [...dyes].sort(() => Math.random() - 0.5);
  const randomDyes: [DyeProps, DyeProps, DyeProps] = [shuffled[0], shuffled[1], shuffled[2]];

  onRandomPick(randomDyes);
}
</script>

<button
  class="btn btn-secondary btn-block"
  onclick={handleRandomPick}
  disabled={disabled || dyes.length < 3}
  aria-label={$t('common.action.random')}
>
  <Shuffle class="h-5 w-5" />
  {$t('common.action.random')}
</button>

{#if dyes.length < 3}
  <div class="text-xs text-error text-center mt-1">
    {$t('common.state.needMoreColors')}
  </div>
{/if}
