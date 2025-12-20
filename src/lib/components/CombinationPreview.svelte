<script lang="ts">
import type { Dye, HarmonyPattern, ColorRatioResult } from '$lib/types';
import { selectPrimaryDye } from '$lib/stores/selection';
import { calculateColorRatio } from '$lib/utils/colorRatio';
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

// ratioResultsから役割順（サブ→アクセント）で提案色を取得
const sortedSuggested = $derived.by(() => {
  if (!ratioResults || !suggestedDyes) return null;
  const subResult = ratioResults[1]; // サブ
  const accentResult = ratioResults[2]; // アクセント
  const subDye = suggestedDyes.find((d) => d.id === subResult.dyeId)!;
  const accentDye = suggestedDyes.find((d) => d.id === accentResult.dyeId)!;
  return [
    { dye: subDye, ratio: subResult },
    { dye: accentDye, ratio: accentResult },
  ] as const;
});

// メインの比率情報
const mainRatio = $derived(ratioResults ? ratioResults[0] : undefined);

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

          {#if sortedSuggested}
            <!-- サブ -->
            <div class="text-center">
              <button
                type="button"
                class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
                style="background-color: {sortedSuggested[0].dye.hex};"
                onclick={() => handleSuggestedDyeClick(sortedSuggested[0].dye)}
                title="この色を選択して新しい組み合わせを提案"
              ></button>
              <h4 class="font-medium text-sm flex items-center justify-center gap-1">
                {#if sortedSuggested[0].dye.lodestone}
                  <a
                    href={sortedSuggested[0].dye.lodestone}
                    class="hover:text-primary transition-colors flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3" />
                    {sortedSuggested[0].dye.name}
                  </a>
                {:else}
                  {sortedSuggested[0].dye.name}
                {/if}
              </h4>
              {#if showRatio}
                <div class="text-xs text-base-content/70 mt-1">
                  <span class="font-semibold">{sortedSuggested[0].ratio.role}</span>
                  <span class="ml-1">{sortedSuggested[0].ratio.percent}%</span>
                </div>
              {/if}
            </div>

            <!-- アクセント -->
            <div class="text-center">
              <button
                type="button"
                class="w-full h-20 rounded-lg border-2 border-base-300 mb-2 hover:border-primary transition-colors cursor-pointer"
                style="background-color: {sortedSuggested[1].dye.hex};"
                onclick={() => handleSuggestedDyeClick(sortedSuggested[1].dye)}
                title="この色を選択して新しい組み合わせを提案"
              ></button>
              <h4 class="font-medium text-sm flex items-center justify-center gap-1">
                {#if sortedSuggested[1].dye.lodestone}
                  <a
                    href={sortedSuggested[1].dye.lodestone}
                    class="hover:text-primary transition-colors flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpenText class="w-3 h-3" />
                    {sortedSuggested[1].dye.name}
                  </a>
                {:else}
                  {sortedSuggested[1].dye.name}
                {/if}
              </h4>
              {#if showRatio}
                <div class="text-xs text-base-content/70 mt-1">
                  <span class="font-semibold">{sortedSuggested[1].ratio.role}</span>
                  <span class="ml-1">{sortedSuggested[1].ratio.percent}%</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- 黄金比の説明ツールチップ -->
        {#if showRatio && ratioResults}
          <div class="flex justify-center">
            <div class="tooltip tooltip-bottom tooltip-info">
              <button type="button" class="btn btn-ghost btn-xs gap-1 text-info">
                <Info class="w-3 h-3" />
                <span class="text-xs">黄金比で魅せるコーデ術</span>
              </button>
              <div class="tooltip-content text-start p-3 max-w-sm">
                <p class="font-semibold mb-1">配色の黄金比</p>
                <p><span class="font-medium">メイン</span>: コーデの主役（胴・脚など広い部分に）</p>
                <p><span class="font-medium">サブ</span>: メインを引き立てる2番手（手・足に）</p>
                <p><span class="font-medium">アクセント</span>: 個性のワンポイント！</p>
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
