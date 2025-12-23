<script lang="ts">
import type { DyeCategory } from '$lib/types';

interface Props {
  selectedCategory: DyeCategory | null;
  onToggleCategory: (category: DyeCategory) => void;
  onClearCategories: () => void;
  onSelectCustomColors?: () => void;
  isCustomColorsSelected?: boolean;
}

const {
  selectedCategory,
  onToggleCategory,
  onClearCategories,
  onSelectCustomColors,
  isCustomColorsSelected = false,
}: Props = $props();

const categories: DyeCategory[] = [
  '白系',
  '赤系',
  '茶系',
  '黄系',
  '緑系',
  '青系',
  '紫系',
  'レア系',
];

function isSelected(category: DyeCategory): boolean {
  return selectedCategory === category;
}

function handleCustomColorsClick() {
  if (onSelectCustomColors) {
    onSelectCustomColors();
  }
}
</script>

<div class="form-control w-full">
  <div class="relative">
    <!-- 横スクロールコンテナ -->
    <div class="flex overflow-x-auto gap-2 pb-2 scroll-smooth scrollbar-hide snap-x">
      {#each categories as category}
        <button
          class="btn btn-sm flex-shrink-0 snap-start min-h-11 min-w-11 {isSelected(category) ? 'btn-primary' : 'btn-outline'}"
          onclick={() => onToggleCategory(category)}
          aria-label="{category}カテゴリを選択"
        >
          {category}
        </button>
      {/each}

      <!-- カスタムカラー選択ボタン -->
      {#if onSelectCustomColors}
        <button
          class="btn btn-sm flex-shrink-0 snap-start min-h-11 {isCustomColorsSelected ? 'btn-secondary' : 'btn-outline'}"
          onclick={handleCustomColorsClick}
          aria-label="カスタムカラーを選択"
        >
          あなたの色
        </button>
      {/if}

      {#if selectedCategory || isCustomColorsSelected}
        <button
          class="btn btn-sm btn-outline flex-shrink-0 snap-start min-h-11"
          onclick={onClearCategories}
          aria-label="フィルターをクリア"
        >
          クリア
        </button>
      {/if}
    </div>

    <!-- 右端フェード効果（スクロールヒント）- モバイルのみ -->
    <div
      class="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-base-200 to-transparent pointer-events-none md:hidden"
    ></div>
  </div>
</div>