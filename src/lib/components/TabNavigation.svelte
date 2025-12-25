<script lang="ts">
import { Heart, Sparkles, SwatchBook } from 'lucide-svelte';
import { resolve } from '$app/paths';
import { page } from '$app/state';

const currentPath = $derived(page.url.pathname);

// パスを事前に解決
const homePath = resolve('/');
const showcasePath = resolve('/showcase');
const favoritesPath = resolve('/favorites');

const isHome = $derived(currentPath === homePath || currentPath === homePath.replace(/\/$/, ''));
const isShowcase = $derived(currentPath === showcasePath);
const isFavorites = $derived(
  currentPath === favoritesPath || currentPath.startsWith(`${favoritesPath}/`)
);
</script>

<!-- フッター固定タブナビゲーション -->
<div class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300">
  <div class="container mx-auto px-4">
    <div class="flex justify-center items-center h-16">
      <!-- タブボタン群 -->
      <div class="flex space-x-8">
        <!-- カララントピッカータブ -->
        <a
          href={homePath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={isHome}
          class:text-primary-content={isHome}
          class:text-base-content={!isHome}
          class:hover:bg-base-300={!isHome}
          aria-label="カララントピッカー"
          data-coach="home-tab"
        >
          <SwatchBook class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">ピッカー</span>
        </a>

        <!-- おすすめタブ -->
        <a
          href={showcasePath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={isShowcase}
          class:text-primary-content={isShowcase}
          class:text-base-content={!isShowcase}
          class:hover:bg-base-300={!isShowcase}
          aria-label="おすすめ"
          data-coach="showcase-tab"
        >
          <Sparkles class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">おすすめ</span>
        </a>

        <!-- スキ！タブ -->
        <a
          href={favoritesPath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px]"
          class:bg-primary={isFavorites}
          class:text-primary-content={isFavorites}
          class:text-base-content={!isFavorites}
          class:hover:bg-base-300={!isFavorites}
          aria-label="スキ！"
        >
          <Heart class="w-6 h-6 mb-1" />
          <span class="text-xs font-medium">スキ！</span>
        </a>
      </div>
    </div>
  </div>
</div>

<!-- フッター分の余白確保 -->
<div class="h-16"></div>

<style>
  /* タブボタンのアクティブ状態アニメーション */
  a {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  a:active {
    transform: scale(0.95);
  }

  /* フォーカス時のアウトライン */
  a:focus-visible {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }
</style>
