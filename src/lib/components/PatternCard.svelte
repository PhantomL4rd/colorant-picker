<script lang="ts">
import { Star } from 'lucide-svelte';
import type { PatternVisual } from '$lib/constants/patterns';

interface Props {
  visual: PatternVisual;
  isSelected: boolean;
  onSelect: () => void;
}

const { visual, isSelected, onSelect }: Props = $props();
</script>

<button
  type="button"
  class="flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ease-out min-w-[100px]
    {isSelected
      ? 'border-primary bg-primary/10 shadow-md'
      : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-md'}"
  onclick={onSelect}
  aria-pressed={isSelected}
  aria-label="{visual.label}パターンを選択"
>
  <!-- サンプル色プレビュー -->
  <div class="flex gap-1 mb-2">
    {#each visual.sampleColors as color}
      <div
        class="w-6 h-6 rounded border border-base-300 shadow-sm"
        style="background-color: {color};"
      ></div>
    {/each}
  </div>

  <!-- ラベル + 人気バッジ -->
  <div class="flex items-center gap-1">
    <span class="text-sm font-medium">{visual.label}</span>
    {#if visual.isPopular}
      <Star class="w-3 h-3 text-warning fill-warning" />
    {/if}
  </div>

  <!-- 説明（選択時のみ表示） -->
  {#if isSelected}
    <span class="text-xs text-base-content/70 mt-1 text-center">
      {visual.description}
    </span>
  {/if}
</button>
