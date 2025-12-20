<script lang="ts">
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { selectPrimaryDye } from '$lib/stores/selection';
import { Palette } from '$lib/models/Palette';
import { BookOpenText, Info } from 'lucide-svelte';

interface Props {
  selectedDye: DyeProps | null;
  suggestedDyes: [DyeProps, DyeProps] | null;
  pattern: HarmonyPattern;
  showRatio?: boolean; // メインピッカー画面でのみtrue
}

const { selectedDye, suggestedDyes, pattern, showRatio = true }: Props = $props();

// 3色が揃っている場合のみパレットを生成
const palette = $derived.by(() => {
  if (!selectedDye || !suggestedDyes) return null;
  return new Palette(selectedDye, suggestedDyes, pattern);
});

function handleSuggestedDyeClick(dye: DyeProps): void {
  selectPrimaryDye(dye);
}
</script>

<div class="card bg-base-100 shadow-lg">
  <div class="card-body">
    {#if selectedDye && suggestedDyes}
      <div class="space-y-6">
        <!-- 3色のプレビュー -->
        <div class="grid grid-cols-3 gap-4">
          <!-- 基本カララント -->
          <div class="text-center">
            <div
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2"
              style="background-color: {selectedDye.hex};"
            ></div>
            <h4 class="font-medium text-sm flex items-center justify-center gap-1">
              {#if selectedDye.lodestone}
                <a
                  href={selectedDye.lodestone}
                  class="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenText class="w-3 h-3" />
                  {selectedDye.name}
                </a>
              {:else}
                {selectedDye.name}
              {/if}
            </h4>
            {#if showRatio && palette}
              <div class="text-xs text-base-content/70 mt-1">
                <span class="font-semibold">{palette.main.role}</span>
                <span class="ml-1">{palette.main.percent}%</span>
              </div>
            {/if}
          </div>

          {#if palette}
            <!-- サブ -->
            <div class="text-center">
              <button
                type="button"
                class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
                style="background-color: {palette.sub.dye.hex};"
                onclick={() => handleSuggestedDyeClick(palette.sub.dye)}
                title="この色を選択して新しい組み合わせを提案"
              ></button>
              <h4 class="font-medium text-sm flex items-center justify-center gap-1">
                {#if palette.sub.dye.lodestone}
                  <a
                    href={palette.sub.dye.lodestone}
                    class="hover:text-primary transition-colors flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3" />
                    {palette.sub.dye.name}
                  </a>
                {:else}
                  {palette.sub.dye.name}
                {/if}
              </h4>
              {#if showRatio}
                <div class="text-xs text-base-content/70 mt-1">
                  <span class="font-semibold">{palette.sub.role}</span>
                  <span class="ml-1">{palette.sub.percent}%</span>
                </div>
              {/if}
            </div>

            <!-- アクセント -->
            <div class="text-center">
              <button
                type="button"
                class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
                style="background-color: {palette.accent.dye.hex};"
                onclick={() => handleSuggestedDyeClick(palette.accent.dye)}
                title="この色を選択して新しい組み合わせを提案"
              ></button>
              <h4 class="font-medium text-sm flex items-center justify-center gap-1">
                {#if palette.accent.dye.lodestone}
                  <a
                    href={palette.accent.dye.lodestone}
                    class="hover:text-primary transition-colors flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3" />
                    {palette.accent.dye.name}
                  </a>
                {:else}
                  {palette.accent.dye.name}
                {/if}
              </h4>
              {#if showRatio}
                <div class="text-xs text-base-content/70 mt-1">
                  <span class="font-semibold">{palette.accent.role}</span>
                  <span class="ml-1">{palette.accent.percent}%</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- 黄金比の説明ツールチップ -->
        {#if showRatio && palette}
          <div class="flex justify-center">
            <div class="tooltip tooltip-bottom tooltip-info">
              <button type="button" class="btn btn-ghost btn-xs gap-1 text-info">
                <Info class="w-3 h-3" />
                <span class="text-xs">いい感じに染色するコツ</span>
              </button>
              <div class="tooltip-content text-start p-3 max-w-sm">
                <p class="font-semibold mb-1">配色の黄金比</p>
                <p><span class="font-medium">メイン</span>: コーデの主役（胴・脚など広い部分に）</p>
                <p><span class="font-medium">サブ</span>: メインを引き立てる2番手（手・足など）</p>
                <p><span class="font-medium">アクセント</span>: 個性際立つワンポイント！</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8 text-base-content/50">
        カララントを選択すると<br />組み合わせプレビューが表示されます
      </div>
    {/if}
  </div>
</div>
