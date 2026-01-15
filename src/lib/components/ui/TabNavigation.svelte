<script lang="ts">
import { Heart, Sparkles, SwatchBook } from '@lucide/svelte';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { t } from '$lib/translations';

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
<div class="fixed bottom-0 left-0 right-0 z-50 bg-muted border-t border-border">
  <div class="container mx-auto px-4">
    <div class="flex justify-center items-center h-16">
      <!-- タブボタン群 -->
      <div class="flex space-x-8">
        <!-- カララントピッカータブ -->
        <a
          href={homePath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px] {isHome ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}"
          aria-label={$t('common.app.name')}
          data-coach="home-tab"
        >
          <SwatchBook class="size-6 mb-1" />
          <span class="text-xs font-medium">{$t('common.nav.picker')}</span>
        </a>

        <!-- おすすめタブ -->
        <a
          href={showcasePath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px] {isShowcase ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}"
          aria-label={$t('common.nav.showcase')}
          data-coach="showcase-tab"
        >
          <Sparkles class="size-6 mb-1" />
          <span class="text-xs font-medium">{$t('common.nav.showcase')}</span>
        </a>

        <!-- スキ！タブ -->
        <a
          href={favoritesPath}
          class="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 min-w-[80px] {isFavorites ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}"
          aria-label={$t('common.nav.favorites')}
        >
          <Heart class="size-6 mb-1" />
          <span class="text-xs font-medium">{$t('common.nav.favorites')}</span>
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
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }
</style>
