import { get, writable } from 'svelte/store';
import type { Dye } from '$lib/models/Dye';
import type { CustomColor, DyeProps, ExtendedDye, HarmonyPattern } from '$lib/types';
import { PATTERN_ORDER } from '$lib/constants/patterns';
import { generateSuggestedDyes } from '$lib/utils/color/colorHarmony';
import { createCustomDye, isCustomDye } from '$lib/utils/color/customColorUtils';
import { dyeStore } from './dyes';
import { filterStore } from './filter';
import { paletteEventBus } from './paletteEvents';

// 選択状態ストア
export const selectionStore = writable<{
  primaryDye: DyeProps | ExtendedDye | null;
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

// 主色（ExtendedDyeを含む）をDyeProps互換に変換（色調和計算用）
function toHarmonyDye(dye: DyeProps | ExtendedDye): DyeProps {
  if (isCustomDye(dye)) {
    return {
      id: dye.id,
      name: dye.name,
      category: dye.category,
      hsv: dye.hsv,
      rgb: dye.rgb,
      hex: dye.hex,
      oklab: dye.oklab,
      tags: dye.tags,
    };
  }
  return dye;
}

// 基本カララント（またはカスタムカラー）を選択
export function selectPrimaryDye(dye: DyeProps | ExtendedDye): void {
  selectionStore.update((state) => {
    const dyesForSuggestion = getDyesForSuggestion();
    const newSeed = Date.now();
    const suggested =
      dyesForSuggestion.length > 0
        ? generateSuggestedDyes(toHarmonyDye(dye), state.pattern, dyesForSuggestion, newSeed)
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
          ? generateSuggestedDyes(
              toHarmonyDye(state.primaryDye),
              pattern,
              dyesForSuggestion,
              newSeed
            )
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
        ? generateSuggestedDyes(
            toHarmonyDye(state.primaryDye),
            state.pattern,
            dyesForSuggestion,
            newSeed
          )
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
  primaryDye: DyeProps | ExtendedDye,
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

// カスタムカラーを選択（便利関数）
export function selectCustomColor(customColor: CustomColor): void {
  selectPrimaryDye(createCustomDye(customColor));
}
