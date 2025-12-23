<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { RefreshCw, Sparkles } from '@lucide/svelte';
import type { ShowcasePalette, ShowcaseData, DyeProps, Favorite } from '$lib/types';
import { Palette } from '$lib/models/Palette';
import ShowcaseItem from '$lib/components/ShowcaseItem.svelte';
import ShareModal from '$lib/components/ShareModal.svelte';
import { loadDyes, dyeStore } from '$lib/stores/dyes';
import { emitRestorePalette } from '$lib/stores/paletteEvents';

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
    error = 'データの取得に失敗しました';
  }
}

onMount(async () => {
  try {
    await loadDyes();
    await fetchShowcase();
  } catch (err) {
    console.error('初期化エラー:', err);
    error = '初期化に失敗しました';
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
</script>

<svelte:head>
  <title>おすすめ | カララントピッカー</title>
</svelte:head>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Sparkles class="w-5 h-5 text-primary" />
      <h1 class="text-xl font-bold">おすすめ</h1>
    </div>

    {#if palettes.length > 0}
      <p class="text-base-content/60 text-sm">
        みんなのスキ！パレット
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
          再読み込み
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
          おすすめパレットを準備中です
        </h2>
        <div class="text-base-content/60 space-y-2">
          <p>素敵な組み合わせをお楽しみに！</p>
        </div>
      </div>
    </div>
  {:else}
    <!-- パレット一覧 -->
    <div class="space-y-4">
      {#each palettes as palette (palette.id)}
        <ShowcaseItem {palette} onSelect={handleSelectPalette} onShare={handleShare} />
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
