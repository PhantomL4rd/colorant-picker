<script lang="ts">
import { Shuffle } from '@lucide/svelte';
import { t } from '$lib/translations';
import type { DyeProps } from '$lib/types';
import { Button } from '$lib/components/ui/button';

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

<Button
  variant="secondary"
  class="w-full gap-2"
  onclick={handleRandomPick}
  disabled={disabled || dyes.length < 3}
  aria-label={$t('common.action.random')}
>
  <Shuffle class="size-5" />
  {$t('common.action.random')}
</Button>

{#if dyes.length < 3}
  <div class="text-xs text-destructive text-center mt-1">
    {$t('common.state.needMoreColors')}
  </div>
{/if}
