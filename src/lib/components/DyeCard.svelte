<script lang="ts">
import type { DyeProps } from '$lib/types';

interface Props {
  dye: DyeProps;
  isSelected?: boolean;
  onSelect: (dye: DyeProps) => void;
}

const { dye, isSelected = false, onSelect }: Props = $props();

function handleClick() {
  onSelect(dye);
}
</script>

<div
  class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer min-w-0 {isSelected ? 'ring-2 ring-primary' : ''}"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="{dye.name}を選択"
  aria-pressed={isSelected}
>
  <div class="card-body p-4 min-w-0">
    <!-- カラーサンプル -->
    <div 
      class="w-full h-16 rounded-lg border-2 border-base-300 mb-3 shadow-sm"
      style="background-color: {dye.hex};"
    ></div>
    
    <!-- カララント名 -->
    <h3 class="card-title text-sm font-medium text-center justify-center text-balance">{dye.name}</h3>
    
  </div>
</div>