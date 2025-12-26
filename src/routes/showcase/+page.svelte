<script lang="ts">
import { RefreshCw, Sparkles } from '@lucide/svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import PaletteCard from '$lib/components/PaletteCard.svelte';
import ShareModal from '$lib/components/ShareModal.svelte';
import { Palette } from '$lib/models/Palette';
import { dyeStore, loadDyes } from '$lib/stores/dyes';
import { favoritesStore, saveFavorite } from '$lib/stores/favorites';
import { emitRestorePalette } from '$lib/stores/paletteEvents';
import { t } from '$lib/translations';
import type { DyeProps, Favorite, HarmonyPattern, ShowcaseData, ShowcasePalette } from '$lib/types';

type PreviewColor = { hex: string; name: string };
type PreviewColors = [PreviewColor, PreviewColor, PreviewColor];

let isLoading = $state(true);
let error = $state<string | null>(null);
let palettes = $state<ShowcasePalette[]>([]);
let dyes = $state<DyeProps[]>([]);

// ShareModal の状態管理
let shareModalOpen = $state(false);
let selectedPaletteForShare = $state<ShowcasePalette | null>(null);

// 染料ストアを購読
dyeStore.subscribe((value) => {
  dyes = value;
});

async function fetchShowcase(): Promise<void> {
  try {
    const response = await fetch('/api/palettes/showcase');
    if (!response.ok) {
      throw new Error(`Failed to fetch showcase: ${response.status}`);
    }
    const data: ShowcaseData = await response.json();
    palettes = data.palettes;
    error = null;
  } catch (err) {
    console.error('Error fetching showcase:', err);
    error = $t('page.showcase.error');
  }
}

onMount(async () => {
  try {
    await loadDyes();
    await fetchShowcase();
  } catch (err) {
    console.error('初期化エラー:', err);
    error = $t('common.state.error');
  } finally {
    isLoading = false;
  }
});

async function handleRetry() {
  isLoading = true;
  error = null;
  await fetchShowcase();
  isLoading = false;
}

function handleSelectPalette(showcasePalette: ShowcasePalette) {
  const palette = Palette.fromShowcase(showcasePalette, dyes);

  if (!palette) {
    console.error('Dye not found for palette:', showcasePalette);
    return;
  }

  // パレット復元イベントを発火
  emitRestorePalette({
    primaryDye: palette.primary,
    suggestedDyes: [...palette.suggested] as [DyeProps, DyeProps],
    pattern: palette.pattern,
  });

  // ピッカーページへ遷移
  goto(resolve('/'));
}

// シェア機能
function handleShare(palette: ShowcasePalette) {
  selectedPaletteForShare = palette;
  shareModalOpen = true;
}

function closeShareModal() {
  shareModalOpen = false;
  selectedPaletteForShare = null;
}

// ShareModal用にFavorite形式に変換
function getFavoriteForShare(): Favorite | null {
  if (!selectedPaletteForShare) return null;

  const palette = Palette.fromShowcase(selectedPaletteForShare, dyes);
  if (!palette) return null;

  return {
    id: `showcase-${selectedPaletteForShare.id}`,
    primaryDye: palette.primary,
    suggestedDyes: [...palette.suggested] as [DyeProps, DyeProps],
    pattern: palette.pattern,
    createdAt: selectedPaletteForShare.createdAt,
  };
}

const favoriteForShare = $derived(getFavoriteForShare());

// お気に入り一覧
const favorites = $derived($favoritesStore);

// プレビュー用のカラー情報を生成（翻訳適用）
function getPreviewColors(showcasePalette: ShowcasePalette): PreviewColors | null {
  const palette = Palette.fromShowcase(showcasePalette, dyes);
  if (!palette) return null;
  const primary = palette.primary;
  const sub = palette.sub.dye;
  const accent = palette.accent.dye;
  return [
    { hex: primary.hex, name: $t(`dye.names.${primary.id}`) || primary.name },
    { hex: sub.hex, name: $t(`dye.names.${sub.id}`) || sub.name },
    { hex: accent.hex, name: $t(`dye.names.${accent.id}`) || accent.name },
  ];
}

// お気に入り済みかチェック
function isFavorited(showcasePalette: ShowcasePalette): boolean {
  const palette = Palette.fromShowcase(showcasePalette, dyes);
  if (!palette) return false;
  return palette.isIn(favorites);
}

// お気に入りに追加
function handleAddToFavorites(showcasePalette: ShowcasePalette) {
  const palette = Palette.fromShowcase(showcasePalette, dyes);
  if (!palette) return;
  saveFavorite({
    primaryDye: palette.primary,
    suggestedDyes: [...palette.suggested] as [DyeProps, DyeProps],
    pattern: palette.pattern,
  });
}

// Favorite形式に変換
function getFavoriteForPalette(showcasePalette: ShowcasePalette): Favorite | null {
  const palette = Palette.fromShowcase(showcasePalette, dyes);
  if (!palette) return null;
  return {
    id: `showcase-${showcasePalette.id}`,
    primaryDye: palette.primary,
    suggestedDyes: [...palette.suggested] as [DyeProps, DyeProps],
    pattern: palette.pattern,
    createdAt: showcasePalette.createdAt,
  };
}
</script>

<svelte:head>
  <title>{$t('page.showcase.title')}</title>
</svelte:head>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Sparkles class="w-5 h-5 text-primary" />
      <h1 class="text-xl font-bold">{$t('page.showcase.heading')}</h1>
    </div>

    {#if palettes.length > 0}
      <p class="text-base-content/60 text-sm">
        {$t('common.nav.showcase')}
      </p>
    {/if}
  </div>

  <!-- コンテンツ -->
  {#if isLoading}
    <!-- ローディング -->
    <div class="flex justify-center items-center min-h-[400px]">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <!-- エラー表示 -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body text-center py-16">
        <div class="alert alert-error mb-4">
          <span>{error}</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick={handleRetry}>
          <RefreshCw class="w-4 h-4" />
          {$t('common.action.restore')}
        </button>
      </div>
    </div>
  {:else if palettes.length === 0}
    <!-- 空の状態 -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body text-center py-16">
        <div class="text-base-content/40 mb-6">
          <Sparkles class="w-20 h-20 mx-auto mb-4" />
        </div>
        <h2 class="text-xl font-semibold mb-4 text-base-content/70">
          {$t('page.showcase.empty')}
        </h2>
      </div>
    </div>
  {:else}
    <!-- パレット一覧 -->
    <div class="space-y-4">
      {#each palettes as showcasePalette (showcasePalette.id)}
        {@const colors = getPreviewColors(showcasePalette)}
        {@const favoriteData = getFavoriteForPalette(showcasePalette)}
        {#if colors && favoriteData}
          <PaletteCard
            {colors}
            pattern={showcasePalette.pattern as HarmonyPattern}
            favoriteForShare={favoriteData}
            showFavoriteButton={true}
            isFavorited={isFavorited(showcasePalette)}
            onSelect={() => handleSelectPalette(showcasePalette)}
            onShare={() => handleShare(showcasePalette)}
            onFavorite={() => handleAddToFavorites(showcasePalette)}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<!-- ShareModal -->
<ShareModal
  isOpen={shareModalOpen}
  favorite={favoriteForShare}
  onClose={closeShareModal}
/>

<style>
  /* スムーズなスクロール */
  .container {
    scroll-behavior: smooth;
  }

  /* パレット項目のアニメーション */
  .space-y-4 > :global(*) {
    animation: fadeInUp 0.3s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
