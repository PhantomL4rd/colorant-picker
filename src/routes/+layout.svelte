<script lang="ts">
import '../app.css';
import { Menu, MessageSquare, Moon, SwatchBook, TriangleAlert } from 'lucide-svelte';
import TabNavigation from '$lib/components/TabNavigation.svelte';

const { children } = $props();

const siteName = 'カララントピッカー';
const siteDescription = 'FF14のカララント（染料）から3色の組み合わせを提案するツールです。';
const newSiteUrl = 'https://colorant-picker.pl4rd.com';
</script>

<svelte:head>
  <title>{siteName}</title>
  <meta name="description" content={siteDescription} />
</svelte:head>

<div class="min-h-dvh bg-base-100">
  <!-- 移転告知バナー -->
  <div class="alert alert-warning rounded-none">
    <TriangleAlert class="w-5 h-5" />
    <span>
      <a href={newSiteUrl} class="link font-bold">{newSiteUrl}</a>へ移転しました（ブックマークを更新してください）
    </span>
  </div>

  <!-- ヘッダー -->
  <header class="navbar bg-primary text-primary-content mb-8">
    <div class="container mx-auto flex items-center">
      <div class="flex-1">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <SwatchBook class="w-6 h-6" />
          {siteName}
        </h1>
      </div>
      <div class="flex-none">
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
              <a
                href="https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5639802/"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2"
              >
                <MessageSquare class="w-5 h-5" />
                要望・感想
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
  
  <!-- フッター固定タブナビゲーション -->
  <TabNavigation />
</div>