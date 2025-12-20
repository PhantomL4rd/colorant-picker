<script lang="ts">
import type { Dye, HarmonyPattern, ColorRatioResult } from '$lib/types';
import { selectPrimaryDye } from '$lib/stores/selection';
import { calculateColorRatio, findByDyeId } from '$lib/utils/colorRatio';
import { BookOpenText, Info } from 'lucide-svelte';

interface Props {
  selectedDye: Dye | null;
  suggestedDyes: [Dye, Dye] | null;
  pattern: HarmonyPattern;
  showRatio?: boolean; // メインピッカー画面でのみtrue
}

const { selectedDye, suggestedDyes, pattern, showRatio = true }: Props = $props();

// 3色が揃っている場合のみ比率を計算
const ratioResults = $derived.by(() => {
  if (!selectedDye || !suggestedDyes) return null;
  return calculateColorRatio([selectedDye, suggestedDyes[0], suggestedDyes[1]]);
});

// 各色の比率情報を取得
const mainRatio = $derived(
  selectedDye && ratioResults ? findByDyeId(ratioResults, selectedDye.id) : undefined
);
const ratio1 = $derived(
  suggestedDyes && ratioResults ? findByDyeId(ratioResults, suggestedDyes[0].id) : undefined
);
const ratio2 = $derived(
  suggestedDyes && ratioResults ? findByDyeId(ratioResults, suggestedDyes[1].id) : undefined
);

function handleSuggestedDyeClick(dye: Dye): void {
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
            {#if showRatio && mainRatio}
              <div class="text-xs text-base-content/70 mt-1">
                <span class="font-semibold">{mainRatio.role}</span>
                <span class="ml-1">{mainRatio.percent}%</span>
              </div>
            {/if}
          </div>

          <!-- 提案カララント1 -->
          <div class="text-center">
            <button
              type="button"
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
              style="background-color: {suggestedDyes[0].hex};"
              onclick={() => handleSuggestedDyeClick(suggestedDyes[0])}
              title="この色を選択して新しい組み合わせを提案"
            ></button>
            <h4 class="font-medium text-sm flex items-center justify-center gap-1">
              {#if suggestedDyes[0].lodestone}
                <a
                  href={suggestedDyes[0].lodestone}
                  class="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenText class="w-3 h-3" />
                  {suggestedDyes[0].name}
                </a>
              {:else}
                {suggestedDyes[0].name}
              {/if}
            </h4>
            {#if showRatio && ratio1}
              <div class="text-xs text-base-content/70 mt-1">
                <span class="font-semibold">{ratio1.role}</span>
                <span class="ml-1">{ratio1.percent}%</span>
              </div>
            {/if}
          </div>

          <!-- 提案カララント2 -->
          <div class="text-center">
            <button
              type="button"
              class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
              style="background-color: {suggestedDyes[1].hex};"
              onclick={() => handleSuggestedDyeClick(suggestedDyes[1])}
              title="この色を選択して新しい組み合わせを提案"
            ></button>
            <h4 class="font-medium text-sm flex items-center justify-center gap-1">
              {#if suggestedDyes[1].lodestone}
                <a
                  href={suggestedDyes[1].lodestone}
                  class="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenText class="w-3 h-3" />
                  {suggestedDyes[1].name}
                </a>
              {:else}
                {suggestedDyes[1].name}
              {/if}
            </h4>
            {#if showRatio && ratio2}
              <div class="text-xs text-base-content/70 mt-1">
                <span class="font-semibold">{ratio2.role}</span>
                <span class="ml-1">{ratio2.percent}%</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- 黄金比の説明ツールチップ -->
        {#if showRatio && ratioResults}
          <div class="flex justify-center">
            <div class="tooltip tooltip-bottom tooltip-info">
              <button type="button" class="btn btn-ghost btn-xs gap-1 text-info">
                <Info class="w-3 h-3" />
                <span class="text-xs">下に書いてあるのはなんの数字？</span>
              </button>
              <div class="tooltip-content text-start p-3">
                <p>コーデにまとまりを出すための黄金比！</p>
                <p>メインを土台に、差し色とアクセントで</p>
                <p>気分に合わせてスパイスをどうぞ🎨</p>
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
