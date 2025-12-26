<script lang="ts">
import { BookOpenText, Info } from 'lucide-svelte';
import { Palette } from '$lib/models/Palette';
import { selectPrimaryDye } from '$lib/stores/selection';
import { t, locale, type Locale } from '$lib/translations';
import { getLodestoneUrl } from '$lib/utils/i18n';
import type { DyeProps, HarmonyPattern, ColorRole } from '$lib/types';

interface Props {
  selectedDye: DyeProps | null;
  suggestedDyes: [DyeProps, DyeProps] | null;
  pattern: HarmonyPattern;
  showRatio?: boolean; // メインピッカー画面でのみtrue
}

const { selectedDye, suggestedDyes, pattern, showRatio = true }: Props = $props();

const currentLocale = $derived($locale as Locale);

// 染料名を翻訳
function getDyeName(dye: DyeProps): string {
  return $t(`dye.names.${dye.id}`) || dye.name;
}

// 役割名を翻訳
function getRoleName(role: ColorRole): string {
  return $t(`common.role.${role}`);
}

// Lodestone URLをローカライズ
function getDyeLodestoneUrl(dye: DyeProps): string | undefined {
  if (!dye.lodestone) return undefined;
  return getLodestoneUrl(dye.lodestone, currentLocale);
}

// 3色が揃っている場合のみパレットを生成
const palette = $derived.by(() => {
  if (!selectedDye || !suggestedDyes) return null;
  return new Palette(selectedDye, suggestedDyes, pattern);
});

function handleSuggestedDyeClick(dye: DyeProps): void {
  selectPrimaryDye(dye);
}

function textColor(dye: DyeProps): string {
  return dye.oklab.l > 0.6 ? '#000' : '#fff';
}
</script>

<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    {#if selectedDye && suggestedDyes}
      <div class="space-y-1 animate-fade-in-up">
        <!-- 3色のプレビュー -->
        <div class="grid grid-cols-3 gap-2 md:gap-4">
          <!-- 基本カララント -->
          <div class="text-center min-w-0 color-swatch" style="--delay: 0ms;">
            <div
              class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300 mb-1 md:mb-2 flex items-center justify-center transition-all duration-300"
              style="background-color: {selectedDye.hex};"
            >
              {#if showRatio && palette}
                <div
                  class="text-xs font-semibold opacity-80 text-center"
                  style="color: {textColor(selectedDye)};"
                >
                  <div>{getRoleName(palette.main.role)}</div>
                  <div>{palette.main.percent}%</div>
                </div>
              {/if}
            </div>
            <h4 class="font-medium text-xs text-balance">
              {#if getDyeLodestoneUrl(selectedDye)}
                <a
                  href={getDyeLodestoneUrl(selectedDye)}
                  class="hover:text-primary transition-colors inline-flex items-center justify-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenText class="w-3 h-3 flex-shrink-0" />
                  <span>{getDyeName(selectedDye)}</span>
                </a>
              {:else}
                {getDyeName(selectedDye)}
              {/if}
            </h4>
          </div>

          {#if palette}
            <!-- サブ -->
            <div class="text-center min-w-0 color-swatch" style="--delay: 50ms;">
              <button
                type="button"
                class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300 mb-1 md:mb-2 transition-all duration-200 cursor-pointer flex items-center justify-center hover:border-primary hover:scale-105 hover:shadow-md active:scale-95"
                style="background-color: {palette.sub.dye.hex};"
                onclick={() => handleSuggestedDyeClick(palette.sub.dye)}
                title={$t('common.aria.selectColor')}
                aria-label="{getDyeName(palette.sub.dye)}"
              >
                {#if showRatio}
                  <div
                    class="text-xs font-semibold opacity-80 text-center"
                    style="color: {textColor(palette.sub.dye)};"
                  >
                    <div>{getRoleName(palette.sub.role)}</div>
                    <div>{palette.sub.percent}%</div>
                  </div>
                {/if}
              </button>
              <h4 class="font-medium text-xs text-balance">
                {#if getDyeLodestoneUrl(palette.sub.dye)}
                  <a
                    href={getDyeLodestoneUrl(palette.sub.dye)}
                    class="hover:text-primary transition-colors inline-flex items-center justify-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3 flex-shrink-0" />
                    <span>{getDyeName(palette.sub.dye)}</span>
                  </a>
                {:else}
                  {getDyeName(palette.sub.dye)}
                {/if}
              </h4>
            </div>

            <!-- アクセント -->
            <div class="text-center min-w-0 color-swatch" style="--delay: 100ms;">
              <button
                type="button"
                class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300 mb-1 md:mb-2 transition-all duration-200 cursor-pointer flex items-center justify-center hover:border-primary hover:scale-105 hover:shadow-md active:scale-95"
                style="background-color: {palette.accent.dye.hex};"
                onclick={() => handleSuggestedDyeClick(palette.accent.dye)}
                title={$t('common.aria.selectColor')}
                aria-label="{getDyeName(palette.accent.dye)}"
              >
                {#if showRatio}
                  <div
                    class="text-xs font-semibold opacity-80 text-center"
                    style="color: {textColor(palette.accent.dye)};"
                  >
                    <div>{getRoleName(palette.accent.role)}</div>
                    <div>{palette.accent.percent}%</div>
                  </div>
                {/if}
              </button>
              <h4 class="font-medium text-xs text-balance">
                {#if getDyeLodestoneUrl(palette.accent.dye)}
                  <a
                    href={getDyeLodestoneUrl(palette.accent.dye)}
                    class="hover:text-primary transition-colors inline-flex items-center justify-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3 flex-shrink-0" />
                    <span>{getDyeName(palette.accent.dye)}</span>
                  </a>
                {:else}
                  {getDyeName(palette.accent.dye)}
                {/if}
              </h4>
            </div>
          {/if}
        </div>

        <!-- 黄金比の説明ツールチップ -->
        {#if showRatio && palette}
          <div class="flex justify-center relative z-10">
            <div class="tooltip tooltip-bottom tooltip-info">
              <button type="button" class="btn btn-ghost btn-xs gap-1 text-info">
                <Info class="w-3 h-3" />
                <span class="text-xs">{$t('page.home.ratioTip.title')}</span>
              </button>
              <div class="tooltip-content text-start p-3 max-w-sm">
                <p class="font-semibold mb-1">{$t('page.home.ratioTip.heading')}</p>
                <p>
                  <span class="font-medium">{$t('common.role.main')}</span>:
                  {$t('page.home.ratioTip.main')}
                </p>
                <p>
                  <span class="font-medium">{$t('common.role.sub')}</span>:
                  {$t('page.home.ratioTip.sub')}
                </p>
                <p>
                  <span class="font-medium">{$t('common.role.accent')}</span>:
                  {$t('page.home.ratioTip.accent')}
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8 text-base-content/50">
        {$t('page.home.selectPrompt')}
      </div>
    {/if}
  </div>
</div>

<style>
  /* 色スウォッチのスタッガーアニメーション */
  .color-swatch {
    animation: swatch-appear 0.3s ease-out forwards;
    animation-delay: var(--delay, 0ms);
    opacity: 0;
  }

  @keyframes swatch-appear {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .color-swatch {
      animation: none;
      opacity: 1;
    }
  }
</style>
