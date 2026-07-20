<script lang="ts">
import { ChevronDown, Loader2, PaintBucket } from '@lucide/svelte';
import { onMount } from 'svelte';
import { get } from 'svelte/store';
import CategoryFilter from '$lib/components/dye/CategoryFilter.svelte';
import DyeGrid from '$lib/components/dye/DyeGrid.svelte';
import PaletteHero from '$lib/components/palette/PaletteHero.svelte';
import * as Collapsible from '$lib/components/ui/collapsible';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import {
  filteredDyes,
  filterStore,
  resetFilters,
  toggleCategory,
  toggleExcludeMetallic,
} from '$lib/stores/filter';
import { selectPrimaryDye, selectionStore, updatePattern } from '$lib/stores/selection';
import { t } from '$lib/translations';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { restorePaletteFromUrl } from '$lib/utils/shareUtils';

let isLoading = $state(true);
let dyesPanelOpen = $state(false);

// PaletteHero に戻すスクロール先
let paletteHeroElement: HTMLElement | undefined = $state();

// 染料選択後にプレビュー（PaletteHero）まで戻るスクロール
function scrollToPaletteHero(): void {
  paletteHeroElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const filteredDyesList = $derived($filteredDyes);
const selectedCategory = $derived($filterStore.categories);
const excludeMetallic = $derived($filterStore.excludeMetallic);
const selectedDye = $derived($selectionStore.primaryDye);

// 軸探索・置換ピッカー用の染料プール（カテゴリは無視、メタリック除外のみ反映）
const exploreDyes = $derived(
  excludeMetallic ? $dyeStore.filter((d) => !d.tags?.includes('metallic')) : $dyeStore
);

const HARMONY_PATTERNS: HarmonyPattern[] = [
  'triadic',
  'split-complementary',
  'analogous',
  'monochromatic',
  'tint',
  'shade',
  'similar',
  'contrast',
  'clash',
];

function pickInitialPalette(): void {
  const dyes = $dyeStore;
  if (dyes.length === 0) return;

  const randomDye = dyes[Math.floor(Math.random() * dyes.length)];
  const randomPattern = HARMONY_PATTERNS[Math.floor(Math.random() * HARMONY_PATTERNS.length)];

  updatePattern(randomPattern);
  selectPrimaryDye(randomDye);
}

onMount(async () => {
  try {
    await loadDyes();

    const dyes = $dyeStore;
    if (dyes.length > 0) {
      const restored = restorePaletteFromUrl(dyes);
      // スキ！/履歴からの復元は paletteEventBus 経由で遷移前に selectionStore へ
      // 反映済みのため、既に選択があるときはランダムピックで上書きしない
      if (!restored && !get(selectionStore).primaryDye) {
        pickInitialPalette();
      }
    }
  } catch (error) {
    console.error('カララントデータの読み込みに失敗しました:', error);
  } finally {
    isLoading = false;
  }
});

function handleDyeSelect(dye: DyeProps): void {
  selectPrimaryDye(dye);
  scrollToPaletteHero();
}

function handleToggleCategory(category: string): void {
  toggleCategory(category as Parameters<typeof toggleCategory>[0]);
}

function handleClearAll(): void {
  resetFilters();
}

function handleExcludeMetallicChange(): void {
  toggleExcludeMetallic();
  if (selectedDye) {
    selectPrimaryDye(selectedDye);
  }
}
</script>

<svelte:head>
  <title>{$t('page.home.title')}</title>
  <link rel="canonical" href="https://colorant-picker.pl4rd.com/" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': 'https://colorant-picker.pl4rd.com/#app',
    name: 'カララントピッカー',
    url: 'https://colorant-picker.pl4rd.com/',
    description: $t('page.home.about.p1'),
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    inLanguage: ['ja', 'en'],
  })}</script>`}
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center h-64">
    <Loader2 class="size-8 animate-spin" />
    <span class="ml-2">{$t('common.state.loading')}</span>
  </div>
{:else}
  <!-- SP では下部固定のスキ！バー分の余白を確保（デスクトップは不要） -->
  <div class="space-y-6 pb-28 md:pb-0">
    <!-- 配色パレット（メイン体験） -->
    <div bind:this={paletteHeroElement}>
      <PaletteHero
        {exploreDyes}
        {excludeMetallic}
        onToggleExcludeMetallic={handleExcludeMetallicChange}
      />
    </div>

    <!-- カララントを直接探す（折りたたみ） -->
    <Collapsible.Root bind:open={dyesPanelOpen}>
      <Collapsible.Trigger
        class="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-2">
          <PaintBucket class="size-5" />
          <span class="font-semibold">{$t('page.palette.action.browseDyes')}</span>
        </div>
        <ChevronDown
          class="size-5 transition-transform duration-200"
          style={dyesPanelOpen ? 'transform: rotate(180deg);' : ''}
        />
      </Collapsible.Trigger>
      <Collapsible.Content class="pt-3 space-y-4">
        <div class="p-4 rounded-2xl border border-border bg-card">
          <CategoryFilter
            {selectedCategory}
            onToggleCategory={handleToggleCategory}
            onClearCategories={handleClearAll}
          />
        </div>

        <div class="p-4 rounded-2xl border border-border bg-card">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-1 text-balance">
            <PaintBucket class="size-5" />
            {$t('page.home.dyeList')}
          </h2>
          <div class="max-h-[600px] overflow-y-auto">
            <DyeGrid dyes={filteredDyesList} {selectedDye} onDyeSelect={handleDyeSelect} />
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  </div>
{/if}
