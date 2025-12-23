<script lang="ts">
import type { HarmonyPattern } from '$lib/types';
import { PATTERN_VISUALS, type PatternVisual } from '$lib/constants/patterns';
import PatternCard from './PatternCard.svelte';
import { Palette } from '@lucide/svelte';

interface Props {
  selectedPattern: HarmonyPattern;
  onPatternChange: (pattern: HarmonyPattern) => void;
  excludeMetallic: boolean;
  onExcludeMetallicChange: () => void;
  patternVisuals?: PatternVisual[];
}

const {
  selectedPattern,
  onPatternChange,
  excludeMetallic,
  onExcludeMetallicChange,
  patternVisuals = PATTERN_VISUALS,
}: Props = $props();

// カルーセルコンテナの参照
let carouselContainer: HTMLElement | undefined = $state();

// 選択されたパターンをスクロールして表示
export function scrollToPattern(pattern: HarmonyPattern) {
  if (!carouselContainer) return;
  const element = carouselContainer.querySelector(`[data-pattern="${pattern}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
}

function handlePatternSelect(pattern: HarmonyPattern) {
  onPatternChange(pattern);
}
</script>

<div class="form-control w-full">
  <h2 class="card-title text-lg mb-4 flex items-center gap-1">
    <Palette class="w-5 h-5" />
    配色パターン
  </h2>

  <!-- パターンカードカルーセル -->
  <div class="relative">
    <div
      bind:this={carouselContainer}
      class="flex overflow-x-auto gap-3 pb-1 scroll-smooth scrollbar-hide snap-x"
    >
      {#each patternVisuals as visual (visual.pattern)}
        <div class="snap-start flex-shrink-0" data-pattern={visual.pattern}>
          <PatternCard
            {visual}
            isSelected={selectedPattern === visual.pattern}
            onSelect={() => handlePatternSelect(visual.pattern)}
          />
        </div>
      {/each}
    </div>

    <!-- 右端フェード効果（スクロールヒント）- モバイルのみ -->
    <div
      class="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-base-200 to-transparent pointer-events-none md:hidden"
    ></div>
  </div>

  <!-- メタリック除外チェックボックス -->
  <div class="form-control mt-1">
    <label class="cursor-pointer label justify-start gap-2">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={excludeMetallic}
        onchange={onExcludeMetallicChange}
      />
      <span class="label-text">メタリック系を除外</span>
    </label>
  </div>
</div>
