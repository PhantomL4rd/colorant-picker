<script lang="ts">
import { Blend, Eye, PaintBucket } from 'lucide-svelte';
import { onMount } from 'svelte';
import AddToFavoritesButton from '$lib/components/AddToFavoritesButton.svelte';
import CategoryFilter from '$lib/components/CategoryFilter.svelte';
import CombinationPreview from '$lib/components/CombinationPreview.svelte';
import CustomColorManager from '$lib/components/CustomColorManager.svelte';
import DyeGrid from '$lib/components/DyeGrid.svelte';
import PatternSelector from '$lib/components/PatternSelector.svelte';
import RandomPickButton from '$lib/components/RandomPickButton.svelte';
import ShareButton from '$lib/components/ShareButton.svelte';
import { generatePatternVisualsWithDyes, type PatternVisual } from '$lib/constants/patterns';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import {
  filteredDyes,
  filterStore,
  resetFilters,
  toggleCategory,
  toggleExcludeMetallic,
} from '$lib/stores/filter';
import { selectionStore, selectPrimaryDye, updatePattern } from '$lib/stores/selection';
import { t } from '$lib/translations';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';
import { restorePaletteFromUrl } from '$lib/utils/shareUtils';

let isLoading = $state(true);

// カスタムカラー表示モード管理
let showCustomColors = $state(false);

// 配色パターン選択エリアへの参照（スクロール先）
let patternSelectorElement: HTMLElement | undefined = $state();

// PatternSelectorコンポーネントの参照
let patternSelectorComponent: ReturnType<typeof PatternSelector> | undefined = $state();

// 動的に生成されたパターンビジュアル
let dynamicPatternVisuals: PatternVisual[] | undefined = $state();

// 未選択時のプレースホルダー用サンプル色
let placeholderColors: [string, string, string] | undefined = $state();

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

    const dyes = $dyeStore;
    if (dyes.length > 0) {
      // URL復元処理
      restorePaletteFromUrl(dyes);

      // パターンサンプル用の代表色を選択（赤系の「Dalamud Red」など鮮やかな色）
      const representativeDye =
        dyes.find((d) => d.name === 'Dalamud Red') ||
        dyes.find((d) => d.category === 'red') ||
        dyes[0];

      if (representativeDye) {
        // 実際のカララントでパターンビジュアルを生成
        dynamicPatternVisuals = generatePatternVisualsWithDyes(representativeDye, dyes);

        // プレースホルダー用のサンプル色を生成（triadicパターンを使用）
        const [sub, accent] = generateSuggestedDyes(representativeDye, 'triadic', dyes);
        placeholderColors = [representativeDye.hex, sub.hex, accent.hex];
      }
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

  // 選択されたパターンをスクロールして表示
  setTimeout(() => {
    patternSelectorComponent?.scrollToPattern(randomPattern);
  }, 100);
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
    <span class="ml-2">{$t('common.state.loading')}</span>
  </div>
{:else}
  <div class="space-y-8">
    <!-- 配色パターン選択 -->
    <div bind:this={patternSelectorElement} class="card bg-base-200 shadow-md" data-coach="pattern-selector">
      <div class="card-body">
        <PatternSelector
          bind:this={patternSelectorComponent}
          {selectedPattern}
          onPatternChange={handlePatternChange}
          {excludeMetallic}
          onExcludeMetallicChange={handleExcludeMetallicChange}
          patternVisuals={dynamicPatternVisuals}
        />
      </div>
    </div>

    <!-- プレビュー -->
    <div aria-live="polite" class="relative z-10">
      {#if selectedDye && suggestedDyes}
        <!-- 組み合わせプレビュー -->
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-3 md:p-6">
            <div class="flex justify-between items-center mb-2 md:mb-4">
              <h2 class="card-title text-lg flex items-center gap-1">
                <Eye class="w-5 h-5" />
                {$t('page.home.preview')}
              </h2>
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
        <!-- 未選択時のプレースホルダー -->
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-3 md:p-6">
            <h2 class="card-title text-lg flex items-center gap-1 text-base-content/40 mb-4">
              <Eye class="w-5 h-5" />
              {$t('page.home.preview')}
            </h2>

            <!-- プレースホルダー色（実際のカララント組み合わせ） -->
            <div class="card bg-base-100 shadow-lg opacity-50">
              <div class="card-body">
                <div class="grid grid-cols-3 gap-2 md:gap-4">
                  <div class="text-center">
                    <div
                      class="w-full h-16 md:h-18 rounded-lg border-2 border-dashed border-base-300 mb-1 md:mb-2"
                      style="background-color: {placeholderColors?.[0] ?? '#E63946'};"
                    ></div>
                    <span class="text-xs text-base-content/50">{$t('common.role.main')}</span>
                  </div>
                  <div class="text-center">
                    <div
                      class="w-full h-16 md:h-18 rounded-lg border-2 border-dashed border-base-300 mb-1 md:mb-2"
                      style="background-color: {placeholderColors?.[1] ?? '#457B9D'};"
                    ></div>
                    <span class="text-xs text-base-content/50">{$t('common.role.sub')}</span>
                  </div>
                  <div class="text-center">
                    <div
                      class="w-full h-16 md:h-18 rounded-lg border-2 border-dashed border-base-300 mb-1 md:mb-2"
                      style="background-color: {placeholderColors?.[2] ?? '#F4A261'};"
                    ></div>
                    <span class="text-xs text-base-content/50">{$t('common.role.accent')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ガイドメッセージ -->
            <div class="text-center mt-4">
              <p class="text-sm text-base-content/60">
                <Blend class="inline-block w-4 h-4 mr-1 align-text-bottom" />
                {$t('page.home.selectPrompt')}
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- ランダム -->
    <div class="card bg-base-200 shadow-md" data-coach="random-button">
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
    <div data-coach="dye-grid">
      <div class="card bg-base-200 shadow-md">
        <div class="card-body">
          {#if showCustomColors}
            <!-- カスタムカラー管理表示 -->
            <div class="max-h-[600px] overflow-y-auto">
              <CustomColorManager />
            </div>
          {:else}
            <!-- 通常のカララント一覧表示 -->
            <h2 class="card-title text-lg mb-4 flex items-center gap-1">
              <PaintBucket class="w-5 h-5" />
              {$t('page.home.dyeList')}
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