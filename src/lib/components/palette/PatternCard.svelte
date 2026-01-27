<script lang="ts">
import { Star } from '@lucide/svelte';
import type { PatternVisual } from '$lib/constants/patterns';
import { t } from '$lib/translations';
import { Badge } from '$lib/components/ui/badge';

interface Props {
  visual: PatternVisual;
  isSelected: boolean;
  onSelect: () => void;
  animationDelay?: number;
}

const { visual, isSelected, onSelect, animationDelay = 0 }: Props = $props();

// パターンキーから翻訳を取得
const patternName = $derived($t(`pattern.${visual.pattern}.name`));
const patternDescription = $derived($t(`pattern.${visual.pattern}.description`));
const patternTagsRaw = $derived($t(`pattern.${visual.pattern}.tags`));
const patternTags = $derived(patternTagsRaw ? patternTagsRaw.split(',') : []);
</script>

<button
  type="button"
  class="pattern-card flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ease-out min-w-[100px]
    {isSelected
      ? 'border-primary bg-primary/10 shadow-md scale-105'
      : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}"
  style="--delay: {animationDelay}ms;"
  onclick={onSelect}
  aria-pressed={isSelected}
  aria-label={$t('common.aria.selectCombination')}
>
  <!-- サンプル色プレビュー -->
  <div class="flex gap-1 mb-2">
    {#each visual.sampleColors as color}
      <div
        class="size-6 rounded border border-border shadow-sm"
        style="background-color: {color};"
      ></div>
    {/each}
  </div>

  <!-- ラベル + 人気バッジ -->
  <div class="flex items-center gap-1">
    <span class="text-sm font-medium">{patternName}</span>
    {#if visual.isPopular}
      <Star class="size-3 text-yellow-500 fill-yellow-500" />
    {/if}
  </div>

  <!-- 印象タグ（常に表示） -->
  <div class="flex gap-1 mt-1 flex-wrap justify-center">
    {#each patternTags as tag}
      <Badge variant="default" class="text-[10px] px-1.5 py-0">#{tag}</Badge>
    {/each}
  </div>

  <!-- 説明文（選択時のみ表示） -->
  {#if isSelected}
    <span class="text-xs text-muted-foreground mt-2 text-center leading-tight">
      {patternDescription}
    </span>
  {/if}
</button>

<style>
  /* 段階的フェードイン */
  .pattern-card {
    animation: card-appear 0.2s ease-out forwards;
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
