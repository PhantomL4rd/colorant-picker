<script lang="ts">
import '../app.css';
import { CircleHelp, SwatchBook, TriangleAlert } from '@lucide/svelte';
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
  <!-- 移転告知バナー（不要になったらこのブロックごと削除） -->
  <div class="bg-yellow-100 border-b border-yellow-200 dark:bg-yellow-100 dark:border-yellow-200">
    <div class="mx-auto max-w-4xl px-4 py-2">
      <a
        href="https://colorant-picker.pl4rd.com"
        class="flex items-center justify-center gap-2 text-sm text-yellow-800 hover:underline"
      >
        <TriangleAlert class="size-4" />
        <span><span class="font-bold">https://colorant-picker.pl4rd.com</span> へ移転しました（ブックマークを更新してください）</span>
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
