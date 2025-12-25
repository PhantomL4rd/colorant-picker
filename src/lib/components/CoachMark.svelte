<script lang="ts">
import { ChevronRight, X } from 'lucide-svelte';
import { onMount, tick } from 'svelte';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CoachMarkStep {
  title: string;
  message: string;
  targetSelectors: string[];
}

const { isOpen, onClose }: Props = $props();

// 定数
const SPOTLIGHT_PADDING = 6;
const SCROLL_DELAY_MS = 300;
const FOCUS_DELAY_MS = 100;

// ステップ定義
const STEPS: CoachMarkStep[] = [
  {
    title: 'ステップ 1/3',
    message: '配色パターンを選ぼう',
    targetSelectors: ['[data-coach="pattern-selector"]'],
  },
  {
    title: 'ステップ 2/3',
    message: 'カララントを選ぼう',
    targetSelectors: ['[data-coach="dye-grid"]'],
  },
  {
    title: 'ステップ 3/3',
    message: '迷ったらランダムやおすすめを使おう',
    targetSelectors: ['[data-coach="random-button"]', '[data-coach="showcase-tab"]'],
  },
];

// 状態
let currentStepIndex = $state(0);
let spotlightRects = $state<DOMRect[]>([]);
let closeButtonRef: HTMLButtonElement | null = $state(null);
let nextButtonRef: HTMLButtonElement | null = $state(null);
let previousFocusElement: HTMLElement | null = null;

// 派生状態
const currentStep = $derived(STEPS[currentStepIndex]);
const isLastStep = $derived(currentStepIndex === STEPS.length - 1);
const paddedRects = $derived.by(() =>
  spotlightRects.map((rect) => ({
    x: rect.left - SPOTLIGHT_PADDING,
    y: rect.top - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  }))
);

/** ハイライト対象要素の位置を計算 */
function updateSpotlightRects(): void {
  if (!currentStep) return;

  spotlightRects = currentStep.targetSelectors
    .map((selector) => document.querySelector(selector))
    .filter((el): el is Element => el !== null)
    .map((el) => el.getBoundingClientRect());
}

/** 対象要素が画面外の場合はスクロール */
async function scrollToFirstTarget(): Promise<void> {
  if (!currentStep) return;

  const element = document.querySelector(currentStep.targetSelectors[0]);
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  await new Promise((resolve) => setTimeout(resolve, SCROLL_DELAY_MS));
}

/** 次のステップへ進む */
async function handleNext(): Promise<void> {
  if (isLastStep) {
    handleClose();
    return;
  }

  currentStepIndex++;
  await tick();
  await scrollToFirstTarget();
  updateSpotlightRects();
}

/** コーチマークを閉じる */
function handleClose(): void {
  currentStepIndex = 0;
  spotlightRects = [];
  onClose();

  if (previousFocusElement) {
    previousFocusElement.focus();
    previousFocusElement = null;
  }
}

/** キーボード操作 */
function handleKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      handleClose();
      break;
    case 'Enter':
      event.preventDefault();
      handleNext();
      break;
    case 'Tab':
      handleTabKey(event);
      break;
  }
}

/** フォーカストラップ */
function handleTabKey(event: KeyboardEvent): void {
  const focusableElements = [closeButtonRef, nextButtonRef].filter(Boolean) as HTMLElement[];
  if (focusableElements.length === 0) return;

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** オーバーレイクリックで閉じる */
function handleOverlayClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}

/** コーチマーク開始時の初期化 */
async function initCoachMark(): Promise<void> {
  previousFocusElement = document.activeElement as HTMLElement;
  currentStepIndex = 0;

  await tick();
  await scrollToFirstTarget();
  updateSpotlightRects();

  setTimeout(() => closeButtonRef?.focus(), FOCUS_DELAY_MS);
}

/** リサイズ・スクロール時にスポットライト位置を更新 */
function handleLayoutChange(): void {
  if (isOpen) updateSpotlightRects();
}

onMount(() => {
  window.addEventListener('resize', handleLayoutChange);
  window.addEventListener('scroll', handleLayoutChange, true);

  return () => {
    window.removeEventListener('resize', handleLayoutChange);
    window.removeEventListener('scroll', handleLayoutChange, true);
  };
});

$effect(() => {
  if (isOpen) initCoachMark();
});
</script>

{#if isOpen && currentStep}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="coach-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="coach-title"
    aria-describedby="coach-message"
    onkeydown={handleKeydown}
    onclick={handleOverlayClick}
  >
    <!-- スポットライト -->
    {#if paddedRects.length > 0}
      <svg class="coach-spotlight" viewBox="0 0 {window.innerWidth} {window.innerHeight}">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {#each paddedRects as rect}
              <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="8" fill="black" />
            {/each}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>
    {/if}

    <!-- ツールチップ -->
    <div class="coach-tooltip bg-primary text-primary-content">
      <header class="flex items-start justify-between gap-2 mb-2">
        <h2 id="coach-title" class="text-sm font-bold">{currentStep.title}</h2>
        <button
          bind:this={closeButtonRef}
          type="button"
          class="btn btn-ghost btn-xs btn-circle text-primary-content hover:bg-primary-focus"
          onclick={handleClose}
          aria-label="ガイドを閉じる"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <p id="coach-message" class="text-sm mb-4">{currentStep.message}</p>

      <footer class="flex justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm text-primary-content" onclick={handleClose}>
          閉じる
        </button>
        <button
          bind:this={nextButtonRef}
          type="button"
          class="btn btn-secondary btn-sm gap-1"
          onclick={handleNext}
        >
          {#if isLastStep}
            完了
          {:else}
            次へ
            <ChevronRight class="w-4 h-4" />
          {/if}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .coach-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }

  .coach-spotlight {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }

  .coach-tooltip {
    position: fixed;
    z-index: 1001;
    border-radius: 12px;
    padding: 1rem;
    max-width: 320px;
    width: calc(100vw - 2rem);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.25),
      0 8px 10px -6px rgba(0, 0, 0, 0.1);

    /* デスクトップ: 画面中央上部 */
    left: 50%;
    top: 20%;
    transform: translateX(-50%);
  }

  /* モバイル: 画面下部に固定 */
  @media (max-width: 768px) {
    .coach-tooltip {
      left: 1rem;
      right: 1rem;
      bottom: 5rem;
      top: auto;
      transform: none;
      width: auto;
      max-width: none;
    }
  }
</style>
