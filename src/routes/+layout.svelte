<script lang="ts">
import '../app.css';
import { CircleHelp, Layers, Menu, MessageSquare, SwatchBook, TriangleAlert } from '@lucide/svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { ModeWatcher } from 'mode-watcher';
import { Button } from '$lib/components/ui/button';
import * as Alert from '$lib/components/ui/alert';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
import * as Tooltip from '$lib/components/ui/tooltip';
import CoachMark from '$lib/components/CoachMark.svelte';
import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
import TabNavigation from '$lib/components/ui/TabNavigation.svelte';
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
  <Alert.Root variant="default" class="rounded-none border-x-0 border-t-0 bg-yellow-50 dark:bg-yellow-900/20">
    <TriangleAlert class="size-5" />
    <Alert.Description class="block">
      <a href="https://colorant-picker.pl4rd.com" class="font-bold underline">https://colorant-picker.pl4rd.com</a>へ移転しました（ブックマークを更新してください）
    </Alert.Description>
  </Alert.Root>

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

        <!-- メニュー -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon"
                aria-label={$t('common.aria.openMenu')}
                class="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Menu class="size-6" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-52">
            <DropdownMenu.Item onSelect={() => goto(resolve('/kasane'))} class="flex items-center gap-2">
              <Layers class="size-5" />
              {$t('common.nav.kasane')}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Label class="text-xs text-muted-foreground">{$t('common.nav.links')}</DropdownMenu.Label>
            <DropdownMenu.Item
              onSelect={() => window.open('https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5639802/', '_blank')}
              class="flex items-center gap-2"
            >
              <MessageSquare class="size-5" />
              {$t('common.feedback.label')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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

  <!-- フッター固定タブナビゲーション -->
  <TabNavigation />

  <!-- コーチマーク -->
  <CoachMark isOpen={isCoachMarkOpen} onClose={closeCoachMark} />
</div>
</Tooltip.Provider>
