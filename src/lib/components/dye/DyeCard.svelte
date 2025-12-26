<script lang="ts">
import type { DyeProps } from '$lib/types';
import { t } from '$lib/translations';

interface Props {
  dye: DyeProps;
  isSelected?: boolean;
  onSelect: (dye: DyeProps) => void;
  animationDelay?: number;
}

const { dye, isSelected = false, onSelect, animationDelay = 0 }: Props = $props();

const displayName = $derived($t(`dye.names.${dye.id}`) || dye.name);

let isClicking = $state(false);

function handleClick() {
  isClicking = true;
  onSelect(dye);
  // バウンスアニメーション終了後にリセット
  setTimeout(() => {
    isClicking = false;
  }, 300);
}
</script>

<div
  class="card bg-base-100 shadow-md cursor-pointer min-w-0
    transition-all duration-200 ease-out
    hover:shadow-lg hover:scale-[1.02]
    active:scale-95
    {isSelected ? 'ring-2 ring-primary animate-pulse-ring' : ''}
    {isClicking ? 'animate-bounce-subtle' : ''}"
  style="animation-delay: {animationDelay}ms;"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
  aria-label={displayName}
  aria-pressed={isSelected}
>
  <div class="card-body p-4 min-w-0">
    <!-- カラーサンプル -->
    <div
      class="w-full h-16 rounded-lg border-2 border-base-300 mb-3 shadow-sm transition-all duration-200
        {isClicking ? 'tap-pulse' : ''}"
      style="background-color: {dye.hex}; --tap-color: {dye.hex};"
    ></div>

    <!-- カララント名 -->
    <h3 class="card-title text-sm font-medium text-center justify-center text-balance">
      {displayName}
    </h3>
  </div>
</div>

<style>
  /* タップ時のパルスエフェクト */
  .tap-pulse {
    animation: color-pulse 0.3s ease-out;
  }

  @keyframes color-pulse {
    0% {
      box-shadow: 0 0 0 0 var(--tap-color);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 8px transparent;
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tap-pulse {
      animation: none;
    }
  }
</style>
