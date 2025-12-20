<script lang="ts">
import { MousePointer, Heart, Check } from '@lucide/svelte';
import type { ShowcasePalette, Dye, Favorite, HarmonyPattern } from '$lib/types';
import { dyeStore } from '$lib/stores/dyes';
import { getPatternLabel } from '$lib/constants/patterns';
import { saveFavorite, favoritesStore, isFavorited } from '$lib/stores/favorites';
import ShareButton from './ShareButton.svelte';
import { calculateColorRatio } from '$lib/utils/colorRatio';

interface Props {
  palette: ShowcasePalette;
  onSelect: (palette: ShowcasePalette) => void;
  onShare: (palette: ShowcasePalette) => void;
}

const { palette, onSelect, onShare }: Props = $props();

// 染料データからIDで検索
let dyes = $state<Dye[]>([]);
dyeStore.subscribe((value) => {
  dyes = value;
});

// お気に入り一覧
const favorites = $derived($favoritesStore);

// IDから染料を取得
function getDyeById(id: string): Dye | undefined {
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

// 役割順（サブ→アクセント）で提案色をソート
const sortedSuggested = $derived.by(() => {
  if (!primaryDye || !suggestedDye1 || !suggestedDye2) return null;
  const results = calculateColorRatio([primaryDye, suggestedDye1, suggestedDye2]);
  const subResult = results[1];
  const accentResult = results[2];
  const suggestedDyes = [suggestedDye1, suggestedDye2];
  const subDye = suggestedDyes.find((d) => d.id === subResult.dyeId)!;
  const accentDye = suggestedDyes.find((d) => d.id === accentResult.dyeId)!;
  return [subDye, accentDye] as const;
});

// 既にお気に入りに登録済みかチェック
const isAlreadyFavorited = $derived(
  primaryDye && suggestedDye1 && suggestedDye2
    ? isFavorited(
        favorites,
        primaryDye,
        [suggestedDye1, suggestedDye2],
        palette.pattern as HarmonyPattern
      )
    : false
);

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
    <!-- エラーメッセージ -->
    {#if error}
      <div class="alert alert-error alert-sm mb-4">
        <span class="text-xs">{error}</span>
      </div>
    {/if}

    <!-- カラープレビュー -->
    <div class="mb-4">
      <div class="grid grid-cols-3 gap-2">
        <!-- プライマリ染料 -->
        <div class="text-center">
          <div
            class="w-full h-12 rounded border border-base-300"
            style="background-color: {getDyeColor(palette.primaryDyeId)};"
            title={getDyeName(palette.primaryDyeId)}
          ></div>
          <div class="text-xs mt-1 truncate" title={getDyeName(palette.primaryDyeId)}>
            {getDyeName(palette.primaryDyeId)}
          </div>
        </div>

        {#if sortedSuggested}
          <!-- サブ -->
          <div class="text-center">
            <div
              class="w-full h-12 rounded border border-base-300"
              style="background-color: {sortedSuggested[0].hex};"
              title={sortedSuggested[0].name}
            ></div>
            <div class="text-xs mt-1 truncate" title={sortedSuggested[0].name}>
              {sortedSuggested[0].name}
            </div>
          </div>

          <!-- アクセント -->
          <div class="text-center">
            <div
              class="w-full h-12 rounded border border-base-300"
              style="background-color: {sortedSuggested[1].hex};"
              title={sortedSuggested[1].name}
            ></div>
            <div class="text-xs mt-1 truncate" title={sortedSuggested[1].name}>
              {sortedSuggested[1].name}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- 操作ボタン -->
    <div class="flex gap-2">
      <button
        class="btn btn-primary btn-sm flex-1"
        onclick={handleSelect}
      >
        <MousePointer class="w-4 h-4" />
        この組み合わせを選択
      </button>

      <!-- スキ！追加ボタン -->
      {#if isAlreadyFavorited}
        <button
          class="btn btn-sm btn-ghost text-success cursor-default"
          disabled
          aria-label="スキ！済み"
        >
          <Heart class="w-4 h-4 fill-current" />
        </button>
      {:else}
        <button
          class="btn btn-sm"
          class:btn-success={showFeedback}
          class:btn-outline={!showFeedback}
          onclick={handleAddToFavorites}
          disabled={isAddingToFavorites || !primaryDye}
          aria-label="スキ！"
        >
          {#if showFeedback}
            <Check class="w-4 h-4" />
          {:else if isAddingToFavorites}
            <span class="loading loading-spinner loading-xs"></span>
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

    <!-- パターン表示 -->
    <div class="text-center mt-2">
      <span class="badge badge-outline badge-sm">{getPatternLabel(palette.pattern)}</span>
    </div>
  </div>
</div>
