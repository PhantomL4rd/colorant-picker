<script lang="ts">
import '../app.css';
import { Sparkles, SwatchBook } from '@lucide/svelte';
import { resolve } from '$app/paths';
import { ModeWatcher } from 'mode-watcher';
import * as Tooltip from '$lib/components/ui/tooltip';
import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
import SideDrawer from '$lib/components/ui/SideDrawer.svelte';
// undo/redo（selectionStore 監視）を全ページで起動するための副作用 import
import '$lib/stores/paletteUndo';
import { t } from '$lib/translations';

const { children } = $props();
</script>

<svelte:head>
  <title>{$t('common.app.name')}</title>
</svelte:head>

<ModeWatcher />
<Tooltip.Provider delayDuration={200}>
  <div class="min-h-dvh bg-background">
    <!-- かさね色目アップデート告知バナー -->
    <div class="bg-notice border-b border-notice">
      <div class="mx-auto max-w-4xl px-4 py-1">
        <a
          href={resolve('/kasane')}
          class="flex items-center justify-center gap-2 text-sm text-notice-foreground hover:underline"
        >
          <Sparkles class="size-4 shrink-0" />
          <span>{$t('common.banner.kasaneUpdate')}</span>
        </a>
      </div>
    </div>

    <!-- ヘッダー -->
    <header class="bg-background border-b border-border">
      <div class="container mx-auto flex items-center h-12 px-4">
        <div class="flex-1">
          <h1 class="text-base font-semibold">
            <a
              href={resolve('/')}
              class="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <SwatchBook class="size-5" />
              {$t('common.app.name')}
            </a>
          </h1>
        </div>
        <div class="flex items-center gap-1">
          <!-- 言語切替 -->
          <LanguageSwitcher />

          <!-- メニュー（サイドドロワー） -->
          <SideDrawer />
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 pt-6 pb-8">
      <main>
        {@render children?.()}
      </main>
    </div>

    <!-- 著作権表示 -->
    <footer class="text-center text-xs text-muted-foreground py-4">© SQUARE ENIX</footer>
  </div>
</Tooltip.Provider>
