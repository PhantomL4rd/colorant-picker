<script lang="ts">
import { Heart, Shuffle } from '@lucide/svelte';
import { favoritesStore, restoreFavorite } from '$lib/stores/favorites';
import type { Favorite } from '$lib/types';
import FavoriteItem from './FavoriteItem.svelte';
import ShareModal from './ShareModal.svelte';

interface Props {
  onSelectFavorite?: (favorite: Favorite) => void;
}

const { onSelectFavorite }: Props = $props();

// ShareModal の状態管理
let shareModalOpen = $state(false);
let selectedFavoriteForShare = $state<Favorite | null>(null);

// お気に入り一覧（作成日時順、新しい順）
const favorites = $derived($favoritesStore);
const sortedFavorites = $derived(
  favorites.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
);

// 件数
const favoriteCount = $derived(favorites.length);

// お気に入りが選択された時の処理
function handleSelectFavorite(favorite: Favorite) {
  try {
    // お気に入りを復元（ピッカーに適用）
    restoreFavorite(favorite);

    // 親コンポーネントにも通知（タブ切り替えなど）
    onSelectFavorite?.(favorite);
  } catch (error) {
    console.error('お気に入りの復元に失敗しました:', error);
  }
}

// シェア機能
function handleShare(favorite: Favorite) {
  selectedFavoriteForShare = favorite;
  shareModalOpen = true;
}

function closeShareModal() {
  shareModalOpen = false;
  selectedFavoriteForShare = null;
}
</script>

<div class="container mx-auto px-4 pb-20 pt-4">
  <!-- ヘッダー -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <Heart class="w-5 h-5 text-primary" />
      <h1 class="text-xl font-bold">スキ！</h1>
    </div>

    {#if favoriteCount > 0}
      <p class="text-base-content/60 text-sm">
        {favoriteCount}件のスキ！があります
      </p>
    {/if}
  </div>

  <!-- コンテンツ -->
  {#if sortedFavorites.length === 0}
    <!-- 空状態 -->
    <div class="card bg-base-200 shadow-md animate-fade-in-up">
      <div class="card-body text-center py-12">
        <!-- ハートアイコン（アニメーション付き） -->
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 animate-pulse-slow">
            <Heart class="w-12 h-12 text-primary/60" />
          </div>
        </div>

        <h2 class="text-xl font-semibold mb-3 text-base-content/80">
          まだスキ！がありません
        </h2>

        <p class="text-base-content/60 text-sm max-w-xs mx-auto">
          ピッカーで気に入った配色を見つけたら、ハートボタンで保存してみよう
        </p>

        <div class="mt-6">
          <a href="/" class="btn btn-primary btn-sm gap-2">
            <Shuffle class="w-4 h-4" />
            配色を探しに行く
          </a>
        </div>
      </div>
    </div>
  {:else}
    <!-- お気に入り一覧 -->
    <div class="space-y-4">
      {#each sortedFavorites as favorite (favorite.id)}
        <FavoriteItem 
          {favorite}
          onSelect={handleSelectFavorite}
          onShare={handleShare}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- ShareModal -->
<ShareModal 
  isOpen={shareModalOpen}
  favorite={selectedFavoriteForShare}
  onClose={closeShareModal}
/>

<style>
  /* スムーズなスクロール */
  .container {
    scroll-behavior: smooth;
  }

  /* お気に入り項目のアニメーション（グローバルのfade-in-upを使用） */
  .space-y-4 > :global(*) {
    animation: fade-in-up 0.3s ease-out forwards;
  }
</style>