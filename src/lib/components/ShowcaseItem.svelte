<script lang="ts">
import { Heart, Check } from '@lucide/svelte';
import type { ShowcasePalette, DyeProps, Favorite, HarmonyPattern } from '$lib/types';
import { dyeStore } from '$lib/stores/dyes';
import { getPatternLabel } from '$lib/constants/patterns';
import { saveFavorite, favoritesStore } from '$lib/stores/favorites';
import ShareButton from './ShareButton.svelte';
import PaletteColorPreview from './PaletteColorPreview.svelte';
import { Palette } from '$lib/models/Palette';

interface Props {
  palette: ShowcasePalette;
  onSelect: (palette: ShowcasePalette) => void;
  onShare: (palette: ShowcasePalette) => void;
}

const { palette, onSelect, onShare }: Props = $props();

// 染料データからIDで検索
let dyes = $state<DyeProps[]>([]);
dyeStore.subscribe((value) => {
  dyes = value;
});

// お気に入り一覧
const favorites = $derived($favoritesStore);

// IDから染料を取得
function getDyeById(id: string): DyeProps | undefined {
  return dyes.find((dye) => dye.id === id);
}

// 染料の色を取得（見つからない場合はグレー）
function getDyeColor(id: string): string {
  const dye = getDyeById(id);
  return dye?.hex ?? '#808080';
}

// 染料名を取得
function getDyeName(id: string): string {
  const dye = getDyeById(id);
  return dye?.name ?? '不明';
}

// 染料オブジェクトを取得
const primaryDye = $derived(getDyeById(palette.primaryDyeId));
const suggestedDye1 = $derived(getDyeById(palette.suggestedDyeIds[0]));
const suggestedDye2 = $derived(getDyeById(palette.suggestedDyeIds[1]));

// パレットを生成
const colorPalette = $derived.by(() => {
  if (!primaryDye || !suggestedDye1 || !suggestedDye2) return null;
  return new Palette(primaryDye, [suggestedDye1, suggestedDye2], palette.pattern as HarmonyPattern);
});

// プレビュー用のカラー情報
const previewColors = $derived.by(() => {
  if (!colorPalette) return null;
  return [
    { hex: getDyeColor(palette.primaryDyeId), name: getDyeName(palette.primaryDyeId) },
    { hex: colorPalette.sub.dye.hex, name: colorPalette.sub.dye.name },
    { hex: colorPalette.accent.dye.hex, name: colorPalette.accent.dye.name },
  ] as [{ hex: string; name: string }, { hex: string; name: string }, { hex: string; name: string }];
});

// 既にお気に入りに登録済みかチェック
const isAlreadyFavorited = $derived(colorPalette?.isIn(favorites) ?? false);

// お気に入り追加の状態
let isAddingToFavorites = $state(false);
let showFeedback = $state(false);
let error = $state('');

function handleSelect() {
  onSelect(palette);
}

function handleShare() {
  onShare(palette);
}

async function handleAddToFavorites() {
  if (isAddingToFavorites || showFeedback) return;
  if (!primaryDye || !suggestedDye1 || !suggestedDye2) return;

  try {
    isAddingToFavorites = true;
    error = '';

    saveFavorite({
      primaryDye,
      suggestedDyes: [suggestedDye1, suggestedDye2],
      pattern: palette.pattern as HarmonyPattern,
    });

    // フィードバック表示
    showFeedback = true;
    setTimeout(() => {
      showFeedback = false;
    }, 2000);
  } catch (err) {
    error = err instanceof Error ? err.message : 'スキ！の追加に失敗しました。';
  } finally {
    isAddingToFavorites = false;
  }
}

// ShareButton用にFavorite形式に変換
const favoriteForShare = $derived<Favorite | null>(
  primaryDye && suggestedDye1 && suggestedDye2
    ? {
        id: `showcase-${palette.id}`,
        primaryDye,
        suggestedDyes: [suggestedDye1, suggestedDye2],
        pattern: palette.pattern as HarmonyPattern,
        createdAt: palette.createdAt,
      }
    : null
);
</script>

<div class="card bg-base-100 shadow-md border border-base-300 transition-shadow hover:shadow-lg">
  <div class="card-body p-4">
    <!-- ヘッダー：操作ボタン -->
    <div class="flex justify-end items-center mb-4">
      <div class="flex gap-1">
        <!-- スキ！追加ボタン -->
        {#if isAlreadyFavorited}
          <button
            class="btn btn-ghost btn-sm btn-circle text-success"
            disabled
            aria-label="スキ！済み"
          >
            <Heart class="w-4 h-4 fill-current" />
          </button>
        {:else}
          <button
            class="btn btn-ghost btn-sm btn-circle"
            class:text-success={showFeedback}
            onclick={handleAddToFavorites}
            disabled={isAddingToFavorites || !primaryDye}
            aria-label="スキ！"
          >
            {#if showFeedback}
              <Check class="w-4 h-4" />
            {:else if isAddingToFavorites}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <Heart class="w-4 h-4" />
            {/if}
          </button>
        {/if}

        {#if favoriteForShare}
          <ShareButton
            favorite={favoriteForShare}
            onShare={handleShare}
          />
        {/if}
      </div>
    </div>

    <!-- エラーメッセージ -->
    {#if error}
      <div class="alert alert-error alert-sm mb-4">
        <span class="text-xs">{error}</span>
      </div>
    {/if}

    <!-- カラープレビュー（クリックで選択） -->
    <div class="mb-4">
      {#if previewColors}
        <PaletteColorPreview colors={previewColors} onSelect={handleSelect} />
      {/if}
    </div>

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(palette.pattern)}</span>
    </div>
  </div>
</div>
