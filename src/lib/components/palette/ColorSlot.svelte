<script lang="ts">
import { Droplet, Sun, SwatchBook } from '@lucide/svelte';
import DyeSourceBadge from '$lib/components/dye/DyeSourceBadge.svelte';
import { t } from '$lib/translations';
import type { ColorRole, DyeProps } from '$lib/types';
import type { LadderAxis } from '$lib/utils/color/axisNeighbors';

interface Props {
  dye: DyeProps;
  role: ColorRole;
  percent: number;
  /** メイン色（軸ラダーボタン表示・クリック不可） */
  isMain: boolean;
  /** 現在の軸ラダーの種別（メインのみ意味を持つ） */
  expandedAxis: LadderAxis | null;
  /** メイン用: 軸ラダーボタンのトグル */
  onAxisToggle?: (axis: LadderAxis) => void;
  /** サブ/アクセント用: クリックでこの色をメインに昇格 */
  onPromote?: () => void;
}

const { dye, role, percent, isMain, expandedAxis, onAxisToggle, onPromote }: Props = $props();

function getDyeName(d: DyeProps): string {
  return $t(`dye.names.${d.id}`) || d.name;
}

// OKLab明度に応じて読みやすいテキスト色を返す
function textColor(d: DyeProps): string {
  return d.oklab.l > 0.6 ? '#0F172A' : '#FFFFFF';
}

const labelColor = $derived(textColor(dye));
const dyeName = $derived(getDyeName(dye));
</script>

{#snippet body()}
  <!-- 役割バッジ + 比率 -->
  <div
    class="flex justify-between items-start px-3 pt-3 text-[11px] font-semibold uppercase tracking-wider opacity-90"
  >
    <span>{$t(`common.role.${role}`)}</span>
    <span class="font-mono normal-case">{percent}%</span>
  </div>

  <!-- 染料名 + 入手元バッジ -->
  <div class="flex-1 flex flex-col items-center justify-center px-3 py-4 text-center gap-1.5">
    <h3 class="text-base md:text-lg font-semibold text-balance leading-tight">{dyeName}</h3>
    <DyeSourceBadge source={dye.source} />
  </div>
{/snippet}

{#if isMain}
  <div
    class="flex flex-col h-full min-h-[160px] md:min-h-[300px] rounded-2xl overflow-hidden transition-colors duration-200"
    style="background-color: {dye.hex}; color: {labelColor};"
  >
    {@render body()}

    <!-- メイン操作ボタン群: 明るさ / 鮮やかさ / 色味 -->
    <div class="flex items-center justify-center gap-0.5 px-2 pb-3">
      <button
        type="button"
        class="p-1.5 rounded-lg opacity-90 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer"
        class:axis-active={expandedAxis === 'lightness'}
        style="color: {labelColor};"
        onclick={() => onAxisToggle?.('lightness')}
        aria-expanded={expandedAxis === 'lightness'}
        aria-label={$t('page.palette.axisExplorer.axis.lightness')}
        title={$t('page.palette.axisExplorer.axis.lightness')}
      >
        <Sun class="size-4" />
      </button>
      <button
        type="button"
        class="p-1.5 rounded-lg opacity-90 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer"
        class:axis-active={expandedAxis === 'chroma'}
        style="color: {labelColor};"
        onclick={() => onAxisToggle?.('chroma')}
        aria-expanded={expandedAxis === 'chroma'}
        aria-label={$t('page.palette.axisExplorer.axis.chroma')}
        title={$t('page.palette.axisExplorer.axis.chroma')}
      >
        <Droplet class="size-4" />
      </button>
      <button
        type="button"
        class="p-1.5 rounded-lg opacity-90 hover:opacity-100 hover:bg-black/10 transition-colors cursor-pointer"
        class:axis-active={expandedAxis === 'hue'}
        style="color: {labelColor};"
        onclick={() => onAxisToggle?.('hue')}
        aria-expanded={expandedAxis === 'hue'}
        aria-label={$t('page.palette.axisExplorer.axis.hue')}
        title={$t('page.palette.axisExplorer.axis.hue')}
      >
        <SwatchBook class="size-4" />
      </button>
    </div>
  </div>
{:else}
  <!-- サブ・アクセント: 全体クリックでメインに昇格 -->
  <button
    type="button"
    class="flex flex-col w-full h-full min-h-[160px] md:min-h-[300px] rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring text-left"
    style="background-color: {dye.hex}; color: {labelColor};"
    onclick={() => onPromote?.()}
    aria-label={$t('common.aria.selectColor')}
    title={$t('common.aria.selectColor')}
  >
    {@render body()}
  </button>
{/if}

<style>
  .axis-active {
    background-color: rgba(0, 0, 0, 0.18);
    opacity: 1;
  }
</style>
