<script lang="ts">
import type { DyeCategory } from '$lib/types';
import { t } from '$lib/translations';
import { Button } from '$lib/components/ui/button';

interface Props {
  selectedCategory: DyeCategory | null;
  onToggleCategory: (category: DyeCategory) => void;
  onClearCategories: () => void;
}

const { selectedCategory, onToggleCategory, onClearCategories }: Props = $props();

const categories: DyeCategory[] = [
  'white',
  'red',
  'brown',
  'yellow',
  'green',
  'blue',
  'purple',
  'rare',
];

// カテゴリ名を翻訳
function getCategoryName(category: DyeCategory): string {
  return $t(`dye.categories.${category}`);
}

function isSelected(category: DyeCategory): boolean {
  return selectedCategory === category;
}
</script>

<div class="w-full">
  <div class="relative">
    <!-- 横スクロールコンテナ -->
    <div class="flex overflow-x-auto gap-2 pb-2 scroll-smooth scrollbar-hide snap-x">
      {#each categories as category}
        <Button
          variant={isSelected(category) ? 'default' : 'outline'}
          size="sm"
          class="flex-shrink-0 snap-start min-h-11 min-w-11"
          onclick={() => onToggleCategory(category)}
          aria-label={getCategoryName(category)}
        >
          {getCategoryName(category)}
        </Button>
      {/each}

      {#if selectedCategory}
        <Button
          variant="outline"
          size="sm"
          class="flex-shrink-0 snap-start min-h-11"
          onclick={onClearCategories}
          aria-label={$t('common.action.clear')}
        >
          {$t('common.action.clear')}
        </Button>
      {/if}
    </div>
  </div>
</div>
