<script lang="ts">
import { Check, X } from '@lucide/svelte';
import { Dialog as DialogPrimitive } from 'bits-ui';
import { t } from '$lib/translations';
import type { DyeProps } from '$lib/types';
import { generateLadder, type LadderAxis } from '$lib/utils/color/axisNeighbors';

interface Props {
  baseDye: DyeProps;
  allDyes: DyeProps[];
  axis: LadderAxis;
  onPick: (dye: DyeProps) => void;
  onClose: () => void;
}

const { baseDye, allDyes, axis, onPick, onClose }: Props = $props();

const ladder = $derived(generateLadder(baseDye, allDyes, axis));
const title = $derived($t(`page.palette.axisExplorer.title.${axis}`));

// 表示形態を幅で切り替える。
// - SP(<md): ビューポート固定のボトムシート。通常フローに依存しないので高さ計算が不要になり、
//   差し込み位置のせいで段が fold 下／固定バーの裏に隠れる問題も、内部スクロールが効かない問題も
//   構造的に消える（Portal で body 直下に出すため祖先の overflow にも縛られない）。
// - md+(PC): 従来どおり色面の下にインラインで差し込む。
// SSR 無効(CSR)前提なので初期値も window から取得してフラッシュを避ける。
let isWide = $state(
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
);
$effect(() => {
  const mq = window.matchMedia('(min-width: 768px)');
  const sync = () => {
    isWide = mq.matches;
  };
  sync();
  mq.addEventListener('change', sync);
  return () => mq.removeEventListener('change', sync);
});

// PC インライン: 65vh の色面に押し下げられて画面外なら穏当に可視域へ寄せる
// （'nearest' なので既に見えていれば動かさない）。
let rootEl = $state<HTMLDivElement>();
$effect(() => {
  if (!isWide || !rootEl) return;
  const el = rootEl;
  const raf = requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  return () => cancelAnimationFrame(raf);
});

// シートは「マウント＝開いた状態」。閉操作(Escape/背景/×/色選択)は onClose で親に閉じてもらう。
let open = $state(true);

function getDyeName(d: DyeProps): string {
  return $t(`dye.names.${d.id}`) || d.name;
}

function textColor(d: DyeProps): string {
  return d.oklab.l > 0.6 ? '#0F172A' : '#FFFFFF';
}
</script>

<!-- 軸ラダー本体（SP シート / PC インラインで共用）。scrollCls で高さ制約だけ差し替える。 -->
{#snippet ladderList(scrollCls: string)}
  <ul class="axis-ladder flex flex-col overflow-y-auto {scrollCls}">
    {#each ladder as { dye, isBase } (`${dye.id}-${isBase}`)}
      <li>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 text-left transition-opacity hover:opacity-90 cursor-pointer"
          style="background-color: {dye.hex}; color: {textColor(dye)};"
          onclick={() => onPick(dye)}
          aria-current={isBase ? 'true' : undefined}
          aria-label={getDyeName(dye)}
        >
          {#if isBase}
            <Check class="size-3.5 flex-shrink-0" aria-hidden="true" />
          {:else}
            <span class="w-3.5 flex-shrink-0" aria-hidden="true"></span>
          {/if}
          <span class="flex-1 text-xs font-medium truncate">{getDyeName(dye)}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#if isWide}
  <!-- PC: 色面の下にインライン差し込み -->
  <div
    bind:this={rootEl}
    class="bg-card border border-border rounded-2xl mt-2 overflow-hidden shadow-sm"
  >
    <div class="flex justify-between items-center px-3 py-2 border-b border-border">
      <span class="text-xs font-medium text-muted-foreground">{title}</span>
      <button
        type="button"
        class="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
        onclick={onClose}
        aria-label={$t('page.palette.axisExplorer.close')}
      >
        <X class="size-3.5" />
      </button>
    </div>
    {@render ladderList('max-h-[60vh]')}
  </div>
{:else}
  <!-- SP: 下からせり上がるボトムシート -->
  <DialogPrimitive.Root
    bind:open
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
  >
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        class="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
      />
      <DialogPrimitive.Content
        class="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[80svh] bg-card border-t border-border rounded-t-2xl shadow-lg pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
      >
        <div class="flex justify-between items-center px-4 py-3 border-b border-border">
          <DialogPrimitive.Title class="text-sm font-medium text-foreground">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description class="sr-only">{title}</DialogPrimitive.Description>
          <DialogPrimitive.Close
            class="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
            aria-label={$t('page.palette.axisExplorer.close')}
          >
            <X class="size-4" />
          </DialogPrimitive.Close>
        </div>
        {@render ladderList('flex-1 min-h-0')}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
{/if}

<style>
  /* スクロールバー常時可視（macOS のオーバーレイ非表示対策。shadcn ScrollArea 相当の狙い）。
     オーバーフローしたときに「スクロールできる」ことが見た目で分かるようにする。 */
  :global(.axis-ladder) {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklab, var(--foreground) 30%, transparent) transparent;
  }
  :global(.axis-ladder)::-webkit-scrollbar {
    width: 8px;
  }
  :global(.axis-ladder)::-webkit-scrollbar-thumb {
    background-color: color-mix(in oklab, var(--foreground) 30%, transparent);
    border-radius: 9999px;
  }
</style>
