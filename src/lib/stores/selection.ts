import { get, writable } from 'svelte/store';
import type { Dye } from '$lib/models/Dye';
import type { DyeProps, HarmonyPattern } from '$lib/types';
import { PATTERN_ORDER } from '$lib/constants/patterns';
import { generateSuggestedDyes } from '$lib/utils/color/colorHarmony';
import { dyeStore } from './dyes';
import { filterStore } from './filter';
import { paletteEventBus } from './paletteEvents';

// 選択状態ストア
export const selectionStore = writable<{
  primaryDye: DyeProps | null;
  suggestedDyes: [DyeProps, DyeProps] | null;
  pattern: HarmonyPattern;
  harmonySeed: number;
}>({
  primaryDye: null,
  suggestedDyes: null,
  pattern: 'triadic',
  harmonySeed: Date.now(),
});

// 提案生成用の染料リストを取得する共通関数
function getDyesForSuggestion(): Dye[] {
  const allDyes = get(dyeStore);
  const currentFilter = get(filterStore);
  return currentFilter.excludeMetallic
    ? allDyes.filter((d) => !d.tags?.includes('metallic'))
    : allDyes;
}

// 基本カララントを選択
export function selectPrimaryDye(dye: DyeProps): void {
  selectionStore.update((state) => {
    const dyesForSuggestion = getDyesForSuggestion();
    const newSeed = Date.now();
    const suggested =
      dyesForSuggestion.length > 0
        ? generateSuggestedDyes(dye, state.pattern, dyesForSuggestion, newSeed)
        : null;

    return {
      ...state,
      primaryDye: dye,
      harmonySeed: newSeed,
      suggestedDyes: suggested,
    };
  });
}

// 配色パターンを変更
export function updatePattern(pattern: HarmonyPattern): void {
  selectionStore.update((state) => {
    let suggested = state.suggestedDyes;
    let newSeed = state.harmonySeed;

    if (state.primaryDye) {
      const dyesForSuggestion = getDyesForSuggestion();
      newSeed = Date.now();
      suggested =
        dyesForSuggestion.length > 0
          ? generateSuggestedDyes(state.primaryDye, pattern, dyesForSuggestion, newSeed)
          : null;
    }

    return {
      ...state,
      pattern,
      harmonySeed: newSeed,
      suggestedDyes: suggested,
    };
  });
}

// 提案カララントを再生成
export function regenerateSuggestions(): void {
  selectionStore.update((state) => {
    if (!state.primaryDye) return state;

    const dyesForSuggestion = getDyesForSuggestion();
    const newSeed = Date.now();
    const suggested =
      dyesForSuggestion.length > 0
        ? generateSuggestedDyes(state.primaryDye, state.pattern, dyesForSuggestion, newSeed)
        : null;

    return {
      ...state,
      harmonySeed: newSeed,
      suggestedDyes: suggested,
    };
  });
}

// 選択をクリア
export function clearSelection(): void {
  selectionStore.set({
    primaryDye: null,
    suggestedDyes: null,
    pattern: 'triadic',
    harmonySeed: Date.now(),
  });
}

// 主色と提案色を直接設定（シェア復元用）
export function setPaletteDirectly(
  primaryDye: DyeProps,
  suggestedDyes: [DyeProps, DyeProps],
  pattern: HarmonyPattern
): void {
  selectionStore.set({
    primaryDye,
    suggestedDyes,
    pattern,
    harmonySeed: Date.now(),
  });
}

// パレット全体をシャッフル: ランダムな主色 + ランダムな配色パターンで提案を再生成
export function shufflePalette(): void {
  selectionStore.update((state) => {
    const dyesForSuggestion = getDyesForSuggestion();
    if (dyesForSuggestion.length === 0) return state;

    const newPrimary = dyesForSuggestion[Math.floor(Math.random() * dyesForSuggestion.length)];
    const newPattern = PATTERN_ORDER[Math.floor(Math.random() * PATTERN_ORDER.length)];
    const newSeed = Date.now();
    const newSuggested = generateSuggestedDyes(newPrimary, newPattern, dyesForSuggestion, newSeed);

    return {
      ...state,
      primaryDye: newPrimary,
      suggestedDyes: newSuggested,
      pattern: newPattern,
      harmonySeed: newSeed,
    };
  });
}

// パレット復元イベントをリッスン
if (typeof window !== 'undefined') {
  paletteEventBus.on('restore-palette', (event) => {
    setPaletteDirectly(event.data.primaryDye, event.data.suggestedDyes, event.data.pattern);
  });
}
