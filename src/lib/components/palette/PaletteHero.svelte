<script lang="ts">
import { Ban, ChevronDown, Redo2, Shuffle, Sparkles, Undo2 } from '@lucide/svelte';
import { PATTERN_ORDER } from '$lib/constants/patterns';
import { Palette } from '$lib/models/Palette';
import { redo, undo, undoState } from '$lib/stores/paletteUndo';
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
  excludeMetallic: boolean; // メタリック除外の現在値
  onToggleExcludeMetallic: () => void; // メタリック除外トグル
}

const { exploreDyes, excludeMetallic, onToggleExcludeMetallic }: Props = $props();

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

// キーボードショートカット（capture phase で先取り）
// - Space: シャッフル（Generate）
// - Cmd/Ctrl+Z: 元に戻す / Cmd/Ctrl+Shift+Z・Cmd/Ctrl+Y: やり直す
// 入力フォーカス時は通常入力を妨げない
$effect(() => {
  function handleKeydown(e: KeyboardEvent) {
    const target = e.target;
    const inEditable =
      target instanceof HTMLElement &&
      target.matches('input, textarea, select, [contenteditable="true"]');

    // undo / redo
    if ((e.metaKey || e.ctrlKey) && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (inEditable) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (key === 'y') {
        if (inEditable) return;
        e.preventDefault();
        redo();
        return;
      }
    }

    // Space → シャッフル
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (inEditable) return;
    // モーダル/ドロップダウン/リストボックスなど、Space が本来の操作を持つ
    // オーバーレイUI内では乗っ取らない（bits-ui の DropdownMenu は role="menu"）
    if (
      target instanceof HTMLElement &&
      target.closest(
        '[role="dialog"], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"]'
      )
    )
      return;
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

<!-- 配色パターン選択ドロップダウン（PC/SP で共用） -->
{#snippet patternDropdown(fullWidth: boolean)}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline" class={`gap-2 ${fullWidth ? 'w-full justify-start' : ''}`}>
          <Sparkles class="size-4" />
          <span class="text-xs text-muted-foreground hidden sm:inline"
            >{$t('page.palette.action.pattern')}:</span
          >
          <span>{$t(`pattern.${selection.pattern}.name`)}</span>
          <ChevronDown class="size-4 opacity-60" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-64">
      {#each PATTERN_ORDER as value (value)}
        <DropdownMenu.Item
          class={selection.pattern === value ? 'bg-accent' : ''}
          onSelect={() => handlePatternSelect(value)}
        >
          <div class="flex flex-col w-full">
            <span class="font-medium">{$t(`pattern.${value}.name`)}</span>
            <span class="text-xs text-muted-foreground">{$t(`pattern.${value}.description`)}</span>
          </div>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

<!-- undo / redo ボタン（PC/SP で共用） -->
{#snippet undoRedo(btnCls: string)}
  <Button
    variant="outline"
    size="icon"
    class={btnCls}
    onclick={undo}
    disabled={!$undoState.canUndo}
    aria-label={$t('common.action.undo')}
    title={$t('common.action.undo')}
  >
    <Undo2 class="size-4" />
  </Button>
  <Button
    variant="outline"
    size="icon"
    class={btnCls}
    onclick={redo}
    disabled={!$undoState.canRedo}
    aria-label={$t('common.action.redo')}
    title={$t('common.action.redo')}
  >
    <Redo2 class="size-4" />
  </Button>
{/snippet}

{#if palette}
  <section class="space-y-3">
    <!-- 3色帯（PaletteHero メイン） -->
    <!-- 黄金比 main:sub:accent の percent を flex-grow に流し込む -->
    <!-- 各スロットは最低幅/高さを確保して操作性を担保 -->
    <div class="flex flex-col md:flex-row md:items-start gap-2 md:min-h-[clamp(400px,65vh,640px)]">
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

    <!-- ===== PC アクションバー: シャッフル(主役) ＋ パターン ＋ undo/redo ＋ スキ/シェア ===== -->
    <div class="hidden md:flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-border bg-card">
      <!-- シャッフル（最も目立つ主要CTA） -->
      <Button onclick={shufflePalette} size="lg" class="gap-2 font-semibold">
        <Shuffle class="size-4" />
        {$t('page.palette.action.shuffle')}
        <kbd
          class="inline-flex ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-background/20 rounded border border-background/30"
          >Space</kbd
        >
      </Button>

      <!-- 配色パターン -->
      {@render patternDropdown(false)}

      <!-- undo / redo -->
      <div class="flex items-center gap-1">
        {@render undoRedo('')}
      </div>

      <!-- 右寄せ: スキ（通常サイズ）・シェア -->
      <div class="flex items-center gap-2 ml-auto">
        <AddToFavoritesButton />
        <ShareButton />
      </div>
    </div>

    <!-- ===== SP: 配色パターン（フロー内、下部バーには入れない） ===== -->
    <div class="md:hidden">
      {@render patternDropdown(true)}
    </div>

    <!-- メタリック除外（控えめに・配色操作の下、右寄せ） -->
    <div class="flex justify-end">
      <button
        type="button"
        onclick={onToggleExcludeMetallic}
        aria-pressed={excludeMetallic}
        class={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors ${
          excludeMetallic
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-transparent text-muted-foreground border-border/60 hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Ban class="size-3.5" />
        {$t('common.filter.excludeMetallic')}
      </button>
    </div>

    <!-- ===== SP 下部固定バー: シャッフル(主役) / undo / redo / スキ / シェア ===== -->
    <!-- 注意: backdrop-filter/transform/filter は fixed 子孫の包含ブロックを生成し、
         スキ！成功トースト(fixed top-4)の基準を奪うため、ここでは使わず不透明背景にする -->
    <div
      class="md:hidden flex items-center gap-1.5 fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <!-- シャッフル（主役・幅広） -->
      <Button onclick={shufflePalette} class="flex-1 gap-2 font-semibold h-10">
        <Shuffle class="size-4" />
        {$t('page.palette.action.shuffle')}
      </Button>

      <!-- undo / redo -->
      {@render undoRedo('size-10')}

      <!-- スキ（アイコン） -->
      <AddToFavoritesButton icon />

      <!-- シェア（アイコン） -->
      <ShareButton />
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
