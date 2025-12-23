<script lang="ts">
import type { DyeProps } from '$lib/types';
import { Shuffle } from '@lucide/svelte';

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
  aria-label="ランダムに色を選択"
>
  <Shuffle class="h-5 w-5" />
  ランダム
</button>

{#if dyes.length < 3}
  <div class="text-xs text-error text-center mt-1">
    3色以上のカララントが必要です
  </div>
{/if}