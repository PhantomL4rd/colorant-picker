<script lang="ts">
import { ChevronDown, Shuffle, Sparkles } from '@lucide/svelte';
import { PATTERN_LABELS, PATTERN_OPTIONS } from '$lib/constants/patterns';
import { Palette } from '$lib/models/Palette';
import {
  selectPrimaryDye,
  selectionStore,
  shufflePalette,
  updatePattern,
} from '$lib/stores/selection';
import { t } from '$lib/translations';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { Button } from '$lib/components/ui/button';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
import AddToFavoritesButton from '$lib/components/favorites/AddToFavoritesButton.svelte';
import ShareButton from '$lib/components/share/ShareButton.svelte';
import type { LadderAxis } from '$lib/utils/color/axisNeighbors';
import AxisExplorer from './AxisExplorer.svelte';
import ColorSlot from './ColorSlot.svelte';

interface Props {
  exploreDyes: DyeProps[]; // 軸探索で使う染料プール（メタリック除外を反映済み）
}

const { exploreDyes }: Props = $props();

// 表示幅の重み（数値ラベルは Palette.ratio の percent をそのまま使うが、
// 帯の見た目は 50:30:20 で固定して全色が視認できるようにする）
const DISPLAY_WEIGHTS: Record<'main' | 'sub' | 'accent', number> = {
  main: 50,
  sub: 30,
  accent: 20,
};

const selection = $derived($selectionStore);

// Palette 計算（黄金比配分はこちらに集約）
const palette = $derived.by(() => {
  if (!selection.primaryDye || !selection.suggestedDyes) return null;
  return new Palette(selection.primaryDye as DyeProps, selection.suggestedDyes, selection.pattern);
});

// メインスロットで開いている軸ラダー（null = 閉じている）
let expandedAxis = $state<LadderAxis | null>(null);

// Spaceキーでシャッフル
// - capture phase で先取りして、フォーカスしているボタンに吸われないようにする
// - 入力フォーカス時は通常のスペース入力を妨げない
$effect(() => {
  function handleKeydown(e: KeyboardEvent) {
    if (e.code !== 'Space' && e.key !== ' ') return;
    const target = e.target;
    if (target instanceof HTMLElement) {
      if (target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (target.closest('[role="dialog"]')) return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    shufflePalette();
  }
  window.addEventListener('keydown', handleKeydown, true);
  return () => window.removeEventListener('keydown', handleKeydown, true);
});

function handleAxisToggle(axis: LadderAxis): void {
  expandedAxis = expandedAxis === axis ? null : axis;
}

function handleAxisClose(): void {
  expandedAxis = null;
}

function handleAxisPick(dye: DyeProps): void {
  selectPrimaryDye(dye);
  expandedAxis = null;
}

function handlePatternSelect(pattern: HarmonyPattern): void {
  updatePattern(pattern);
}
</script>

{#if palette}
  <section class="space-y-3">
    <!-- 3色帯（PaletteHero メイン） -->
    <!-- 黄金比 main:sub:accent の percent を flex-grow に流し込む -->
    <!-- 各スロットは最低幅/高さを確保して操作性を担保 -->
    <div class="flex flex-col md:flex-row md:items-start gap-2 md:min-h-[320px]">
      {#each palette.ratio as { dye, role, percent } (role)}
        <div
          class="slot-wrap flex flex-col min-w-0 md:min-w-[140px]"
          style="--p: {DISPLAY_WEIGHTS[role]};"
        >
          <ColorSlot
            {dye}
            {role}
            {percent}
            isMain={role === 'main'}
            expandedAxis={role === 'main' ? expandedAxis : null}
            onAxisToggle={role === 'main' ? handleAxisToggle : undefined}
            onPromote={role !== 'main' ? () => selectPrimaryDye(dye) : undefined}
          />
          {#if role === 'main' && expandedAxis}
            <AxisExplorer
              baseDye={dye}
              allDyes={exploreDyes}
              axis={expandedAxis}
              onPick={handleAxisPick}
              onClose={handleAxisClose}
            />
          {/if}
        </div>
      {/each}
    </div>

    <!-- アクションバー -->
    <div class="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-border bg-card">
      <!-- パターンドロップダウン -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="gap-2">
              <Sparkles class="size-4" />
              <span class="text-xs text-muted-foreground hidden sm:inline"
                >{$t('page.palette.action.pattern')}:</span
              >
              <span>{PATTERN_LABELS[selection.pattern]}</span>
              <ChevronDown class="size-4 opacity-60" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-64">
          {#each PATTERN_OPTIONS as opt (opt.value)}
            <DropdownMenu.Item
              class={selection.pattern === opt.value ? 'bg-accent' : ''}
              onSelect={() => handlePatternSelect(opt.value)}
            >
              <div class="flex flex-col w-full">
                <span class="font-medium">{opt.label}</span>
                <span class="text-xs text-muted-foreground">{opt.description}</span>
              </div>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <!-- シャッフル（メインCTA） -->
      <Button onclick={shufflePalette} class="gap-2 order-3 md:order-2 w-full md:w-auto">
        <Shuffle class="size-4" />
        {$t('page.palette.action.shuffle')}
        <kbd
          class="hidden md:inline-flex ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-background/20 rounded border border-background/30"
          >Space</kbd
        >
      </Button>

      <!-- 右寄せ: 保存・シェア -->
      <div class="flex items-center gap-2 ml-auto order-2 md:order-3">
        <AddToFavoritesButton />
        <ShareButton />
      </div>
    </div>
  </section>
{/if}

<style>
  /* スロット幅・高さ配分:
     - モバイル(<md): 3スロット均等の高さで縦並び（percentに依存しない）
     - デスクトップ(>=md): percent を flex-grow に反映して黄金比配分 */
  .slot-wrap {
    flex: 1 1 0;
  }
  @media (min-width: 768px) {
    .slot-wrap {
      flex: var(--p) 1 0;
    }
  }
</style>
