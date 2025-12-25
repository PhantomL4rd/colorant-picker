<script lang="ts">
import { ChevronDown } from 'lucide-svelte';
import type { DyeProps } from '$lib/types';
import DyeCard from './DyeCard.svelte';

interface Props {
  dyes: DyeProps[];
  selectedDye?: DyeProps | null;
  onDyeSelect: (dye: DyeProps) => void;
}

const { dyes, selectedDye = null, onDyeSelect }: Props = $props();

// 段階的読み込み設定
const INITIAL_COUNT = 24;
const LOAD_MORE_COUNT = 24;

let visibleCount = $state(INITIAL_COUNT);

// フィルター変更時（dyes配列が変わった時）にリセット
const dyesLength = $derived(dyes.length);
let prevDyesLength = $state(0);
$effect(() => {
  if (dyesLength !== prevDyesLength) {
    visibleCount = INITIAL_COUNT;
    prevDyesLength = dyesLength;
  }
});

// 表示する染料
const visibleDyes = $derived(dyes.slice(0, visibleCount));
const hasMore = $derived(visibleCount < dyes.length);
const remainingCount = $derived(Math.min(LOAD_MORE_COUNT, dyes.length - visibleCount));

function loadMore() {
  visibleCount = Math.min(visibleCount + LOAD_MORE_COUNT, dyes.length);
}
</script>

<div class="w-full">
  {#if dyes.length === 0}
    <div class="text-center py-12 animate-fade-in-up">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-300/50 mb-4">
        <span class="text-2xl">🎨</span>
      </div>
      <p class="text-base-content/50 text-sm">該当するカララントがありません</p>
      <p class="text-base-content/40 text-xs mt-1">フィルターを変更してみてください</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {#each visibleDyes as dye, index (dye.id)}
        <DyeCard
          {dye}
          isSelected={selectedDye?.id === dye.id}
          onSelect={onDyeSelect}
          animationDelay={index < INITIAL_COUNT ? index * 30 : 0}
        />
      {/each}
    </div>

    {#if hasMore}
      <div class="flex justify-center mt-6">
        <button
          type="button"
          class="btn btn-outline btn-sm gap-2"
          onclick={loadMore}
        >
          <ChevronDown class="w-4 h-4" />
          もっと見る（残り{remainingCount}色）
        </button>
      </div>
    {/if}
  {/if}
</div>
