<script lang="ts">
import { Palette } from '@lucide/svelte';
import { PATTERN_VISUALS, type PatternVisual } from '$lib/constants/patterns';
import { t } from '$lib/translations';
import type { HarmonyPattern } from '$lib/types';
import { Checkbox } from '$lib/components/ui/checkbox';
import { Label } from '$lib/components/ui/label';
import PatternCard from './PatternCard.svelte';

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

<div class="w-full">
  <h2 class="text-lg font-semibold mb-4 flex items-center gap-1">
    <Palette class="size-5" />
    {$t('page.home.patternSection')}
  </h2>

  <!-- パターンカードカルーセル -->
  <div class="relative">
    <div
      bind:this={carouselContainer}
      class="flex overflow-x-auto gap-3 pb-1 scroll-smooth scrollbar-hide snap-x"
    >
      {#each patternVisuals as visual, index (visual.pattern)}
        <div class="snap-start flex-shrink-0" data-pattern={visual.pattern}>
          <PatternCard
            {visual}
            isSelected={selectedPattern === visual.pattern}
            onSelect={() => handlePatternSelect(visual.pattern)}
            animationDelay={index * 60}
          />
        </div>
      {/each}
    </div>

    <!-- 右端フェード効果（スクロールヒント）- モバイルのみ -->
    <div
      class="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none md:hidden"
    ></div>
  </div>

  <!-- メタリック除外チェックボックス -->
  <div class="flex items-center space-x-2 mt-3">
    <Checkbox
      id="exclude-metallic"
      checked={excludeMetallic}
      onCheckedChange={onExcludeMetallicChange}
    />
    <Label for="exclude-metallic" class="text-sm cursor-pointer">
      {$t('common.filter.excludeMetallic')}
    </Label>
  </div>
</div>
