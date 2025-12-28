<script lang="ts">
import '../app.css';
import { CircleHelp, Layers, Menu, MessageSquare, Moon, SwatchBook, TriangleAlert } from 'lucide-svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
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

<div class="min-h-dvh bg-base-100">
  <!-- 移転告知バナー（不要になったらこのブロックごと削除） -->
  <div class="alert alert-warning rounded-none">
    <TriangleAlert class="w-5 h-5" />
    <span>
      <a href="https://colorant-picker.pl4rd.com" class="link font-bold">https://colorant-picker.pl4rd.com</a>へ移転しました（ブックマークを更新してください）
    </span>
  </div>

  <!-- ヘッダー -->
  <header class="navbar bg-primary text-primary-content mb-8">
    <div class="container mx-auto flex items-center">
      <div class="flex-1">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <SwatchBook class="w-6 h-6" />
          {$t('common.app.name')}
        </h1>
      </div>
      <div class="flex-none flex items-center gap-1">
        <!-- 言語切替 -->
        <LanguageSwitcher />

        <!-- ヘルプボタン -->
        <button
          type="button"
          class="btn btn-ghost btn-circle"
          onclick={openCoachMark}
          aria-label={$t('common.aria.help')}
        >
          <CircleHelp class="w-6 h-6" />
        </button>

        <!-- メニュー -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost">
            <Menu class="w-6 h-6" />
          </div>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-200 text-base-content rounded-box z-10 w-52 p-2 shadow mt-2"
          >
            <li>
              <a href={resolve('/kasane')} class="flex items-center gap-2">
                <Layers class="w-5 h-5" />
                {$t('common.nav.kasane')}
              </a>
            </li>
            <li class="menu-title pt-2">
              <span class="text-xs text-base-content/50">{$t('common.nav.links')}</span>
            </li>
            <li>
              <a
                href="https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5639802/"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2"
              >
                <MessageSquare class="w-5 h-5" />
                {$t('common.feedback.label')}
              </a>
            </li>
            <li>
              <a
                href="https://fortune.pl4rd.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2"
              >
                <Moon class="w-5 h-5" />
                シャーレアン式占星術
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>

  <div class="container mx-auto px-4 pb-8">
    <main>
      {@render children?.()}
    </main>
  </div>

  <!-- 著作権表示 -->
  <footer class="text-center text-xs text-base-content/50 py-4">
    © SQUARE ENIX
  </footer>

  <!-- フッター固定タブナビゲーション -->
  <TabNavigation />

  <!-- コーチマーク -->
  <CoachMark isOpen={isCoachMarkOpen} onClose={closeCoachMark} />
</div>