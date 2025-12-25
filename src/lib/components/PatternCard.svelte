<script lang="ts">
import { Star } from 'lucide-svelte';
import type { PatternVisual } from '$lib/constants/patterns';

interface Props {
  visual: PatternVisual;
  isSelected: boolean;
  onSelect: () => void;
  animationDelay?: number;
}

const { visual, isSelected, onSelect, animationDelay = 0 }: Props = $props();
</script>

<button
  type="button"
  class="pattern-card flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ease-out min-w-[100px]
    {isSelected
      ? 'border-accent bg-accent/10 shadow-md scale-105'
      : 'border-base-300 bg-base-100 hover:border-accent/50 hover:shadow-md'}"
  style="--delay: {animationDelay}ms;"
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

  <!-- 印象タグ（常に表示） -->
  <div class="flex gap-1 mt-1 flex-wrap justify-center">
    {#each visual.tags as tag}
      <span class="badge badge-primary badge-xs">#{tag}</span>
    {/each}
  </div>

  <!-- 説明文（選択時のみ表示） -->
  {#if isSelected}
    <span class="text-xs text-base-content/70 mt-2 text-center leading-tight">
      {visual.description}
    </span>
  {/if}
</button>

<style>
  /* 段階的フェードイン */
  .pattern-card {
    animation: card-appear 0.4s ease-out forwards;
    animation-delay: var(--delay, 0ms);
    opacity: 0;
  }

  @keyframes card-appear {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pattern-card {
      animation: none;
      opacity: 1;
    }
  }
</style>
