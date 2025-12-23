<script lang="ts">
import { onMount } from 'svelte';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { loadDyes, dyeStore } from '$lib/stores/dyes';
import { selectionStore, selectPrimaryDye, updatePattern } from '$lib/stores/selection';
import {
  filterStore,
  filteredDyes,
  toggleCategory,
  resetFilters,
  toggleExcludeMetallic,
} from '$lib/stores/filter';
import { restorePaletteFromUrl } from '$lib/utils/shareUtils';
import { PaintBucket, Blend } from 'lucide-svelte';

import DyeGrid from '$lib/components/DyeGrid.svelte';
import CombinationPreview from '$lib/components/CombinationPreview.svelte';
import PatternSelector from '$lib/components/PatternSelector.svelte';
import CategoryFilter from '$lib/components/CategoryFilter.svelte';
import RandomPickButton from '$lib/components/RandomPickButton.svelte';
import AddToFavoritesButton from '$lib/components/AddToFavoritesButton.svelte';
import ShareButton from '$lib/components/ShareButton.svelte';
import CustomColorManager from '$lib/components/CustomColorManager.svelte';

let isLoading = $state(true);

// カスタムカラー表示モード管理
let showCustomColors = $state(false);

// 配色パターン選択エリアへの参照（スクロール先）
let patternSelectorElement: HTMLElement | undefined = $state();

// ストアから状態を取得
const selectedDye = $derived($selectionStore.primaryDye);
const suggestedDyes = $derived($selectionStore.suggestedDyes);
const selectedPattern = $derived($selectionStore.pattern);
const filteredDyesList = $derived($filteredDyes);
const selectedCategory = $derived($filterStore.categories);
const excludeMetallic = $derived($filterStore.excludeMetallic);

onMount(async () => {
  try {
    await loadDyes();

    // URL復元処理
    const dyes = $dyeStore;
    if (dyes.length > 0) {
      restorePaletteFromUrl(dyes);
    }

    isLoading = false;
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
    isLoading = false;
  }
});

function handleDyeSelect(dye: DyeProps) {
  selectPrimaryDye(dye);

  // カラーが選択されたら配色パターン選択までスクロール
  setTimeout(() => {
    if (patternSelectorElement) {
      patternSelectorElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }, 100);
}

function handlePatternChange(pattern: HarmonyPattern) {
  updatePattern(pattern);
}

function handleToggleCategory(category: string) {
  showCustomColors = false; // カテゴリ選択時はカスタムカラーを非表示
  toggleCategory(category as any);
}

function handleClearCategories() {
  resetFilters();
}

function handleRandomPick(randomDyes: [DyeProps, DyeProps, DyeProps]) {
  const [primary] = randomDyes;

  // 配色パターンもランダムに選択
  const patterns: HarmonyPattern[] = [
    'triadic',
    'split-complementary',
    'analogous',
    'monochromatic',
    'similar',
    'contrast',
    'clash',
  ];
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];

  // 配色パターンを先に設定
  updatePattern(randomPattern);

  // その後、主色を選択（提案は自動生成される）
  selectPrimaryDye(primary);
}

function handleExcludeMetallicChange() {
  toggleExcludeMetallic();
  // メタリック除外フィルターが変更されたら現在の色で新しい提案を生成
  if (selectedDye) {
    selectPrimaryDye(selectedDye);
  }
}

// カスタムカラー選択ハンドラー
function handleSelectCustomColors() {
  showCustomColors = true;
  resetFilters(); // 通常カテゴリをクリア
}

// カテゴリまたはクリアボタンクリック時にカスタムカラーも非表示に
function handleClearAll() {
  showCustomColors = false;
  handleClearCategories();
}
</script>

{#if isLoading}
  <div class="flex justify-center items-center h-64">
    <span class="loading loading-spinner loading-lg"></span>
    <span class="ml-2">カララントデータを読み込み中...</span>
  </div>
{:else}
  <div class="space-y-8">
    <!-- 配色パターン選択 -->
    <div bind:this={patternSelectorElement} class="card bg-base-200 shadow-md">
      <div class="card-body">
        <PatternSelector
          {selectedPattern}
          onPatternChange={handlePatternChange}
          {excludeMetallic}
          onExcludeMetallicChange={handleExcludeMetallicChange}
        />
      </div>
    </div>

    <!-- プレビュー -->
    <div aria-live="polite">
      {#if selectedDye && suggestedDyes}
        <!-- 組み合わせプレビュー -->
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-3 md:p-6">
            <div class="flex justify-between items-center mb-2 md:mb-4">
              <h2 class="card-title text-base md:text-lg">プレビュー</h2>
              <div class="flex gap-2">
                <AddToFavoritesButton disabled={!selectedDye || !suggestedDyes} />
                <ShareButton disabled={!selectedDye || !suggestedDyes} />
              </div>
            </div>
            <CombinationPreview
              selectedDye={selectedDye}
              suggestedDyes={suggestedDyes}
              pattern={selectedPattern}
            />
          </div>
        </div>
      {:else}
        <!-- 未選択時のメッセージ -->
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-3 md:p-6 text-center">
            <div class="text-base-content/60">
              <Blend class="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-4 opacity-50" />
              <p class="text-base md:text-lg font-medium mb-1 md:mb-2">カララントを選択してください</p>
              <p class="text-xs md:text-sm">
                カララント一覧から気に入った色を選ぶか、<br />
                ランダムピックボタンで自動選択してみましょう。
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- ランダム -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body">
        <RandomPickButton
          dyes={filteredDyesList}
          onRandomPick={handleRandomPick}
        />
      </div>
    </div>

    <!-- カテゴリフィルター -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body">
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onToggleCategory={handleToggleCategory}
          onClearCategories={handleClearAll}
          onSelectCustomColors={handleSelectCustomColors}
          isCustomColorsSelected={showCustomColors}
        />
      </div>
    </div>
    
    <!-- カララント一覧またはカスタムカラー管理 -->
    <div>
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          {#if showCustomColors}
            <!-- カスタムカラー管理表示 -->
            <div class="max-h-[600px] overflow-y-auto">
              <CustomColorManager />
            </div>
          {:else}
            <!-- 通常のカララント一覧表示 -->
            <h2 class="card-title text-lg mb-4 flex items-center gap-2">
              <PaintBucket class="w-5 h-5" />
              カララント一覧
            </h2>
            <div class="max-h-[600px] overflow-y-auto">
              <DyeGrid 
                dyes={filteredDyesList}
                {selectedDye}
                onDyeSelect={handleDyeSelect}
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}