<script lang="ts">
import '../app.css';
import { CircleHelp, Info, SwatchBook } from '@lucide/svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { ModeWatcher } from 'mode-watcher';
import { Button } from '$lib/components/ui/button';
import * as Tooltip from '$lib/components/ui/tooltip';
import CoachMark from '$lib/components/CoachMark.svelte';
import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
import SideDrawer from '$lib/components/ui/SideDrawer.svelte';
import { t } from '$lib/translations';

const { children } = $props();

// コーチマーク表示状態
let isCoachMarkOpen = $state(false);

function openCoachMark() {
  // コーチマークはピッカータブで表示するため、ホームに遷移
  goto(resolve('/'));
  isCoachMarkOpen = true;
}

function closeCoachMark() {
  isCoachMarkOpen = false;
}
</script>

<svelte:head>
  <title>{$t('common.app.name')}</title>
</svelte:head>

<ModeWatcher />
<Tooltip.Provider delayDuration={200}>

<div class="min-h-dvh bg-background">
  <!-- ミラプリインサイト告知バナー -->
  <div class="bg-sky-50 border-b border-sky-200 dark:bg-sky-950 dark:border-sky-800">
    <div class="mx-auto max-w-4xl px-4 py-2">
      <a
        href="https://mirapri-insight.pl4rd.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center gap-2 text-sm text-sky-700 dark:text-sky-300 hover:underline"
      >
        <Info class="size-4 shrink-0" />
        <span>{$t('common.banner.mirapriInsight')}</span>
      </a>
    </div>
  </div>

  <!-- ヘッダー -->
  <header class="bg-primary text-primary-foreground mb-8">
    <div class="container mx-auto flex items-center h-14 px-4">
      <div class="flex-1">
        <h1 class="text-xl font-bold">
          <a href={resolve('/')} class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <SwatchBook class="size-6" />
            {$t('common.app.name')}
          </a>
        </h1>
      </div>
      <div class="flex items-center gap-1">
        <!-- 言語切替 -->
        <LanguageSwitcher />

        <!-- ヘルプボタン -->
        <Button
          variant="ghost"
          size="icon"
          onclick={openCoachMark}
          aria-label={$t('common.aria.help')}
          class="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <CircleHelp class="size-6" />
        </Button>

        <!-- メニュー（サイドドロワー） -->
        <SideDrawer />
      </div>
    </div>
  </header>

  <div class="container mx-auto px-4 pb-8">
    <main>
      {@render children?.()}
    </main>
  </div>

  <!-- 著作権表示 -->
  <footer class="text-center text-xs text-muted-foreground py-4">
    © SQUARE ENIX
  </footer>


  <!-- コーチマーク -->
  <CoachMark isOpen={isCoachMarkOpen} onClose={closeCoachMark} />
</div>
</Tooltip.Provider>
