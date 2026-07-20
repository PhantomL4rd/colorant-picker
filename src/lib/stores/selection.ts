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

// ランダム主色ピック用の染料リスト（メタリック除外時はメタリックを抜く）。
// 提案生成自体は常に全染料プールで行い、結果のメタリックだけが置換される（generateSuggestedDyes 側で処理）。
function getDyesForRandomPick(): Dye[] {
  const allDyes = get(dyeStore);
  const currentFilter = get(filterStore);
  return currentFilter.excludeMetallic
    ? allDyes.filter((d) => !d.tags?.includes('metallic'))
    : allDyes;
}

// 基本カララントを選択
export function selectPrimaryDye(dye: DyeProps): void {
  selectionStore.update((state) => {
    const allDyes = get(dyeStore);
    const excludeMetallic = get(filterStore).excludeMetallic;
    const newSeed = Date.now();
    const suggested =
      allDyes.length > 0
        ? generateSuggestedDyes(dye, state.pattern, allDyes, newSeed, excludeMetallic)
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
      const allDyes = get(dyeStore);
      const excludeMetallic = get(filterStore).excludeMetallic;
      newSeed = Date.now();
      suggested =
        allDyes.length > 0
          ? generateSuggestedDyes(state.primaryDye, pattern, allDyes, newSeed, excludeMetallic)
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
    const randomPickPool = getDyesForRandomPick();
    if (randomPickPool.length === 0) return state;

    const allDyes = get(dyeStore);
    const excludeMetallic = get(filterStore).excludeMetallic;
    const newPrimary = randomPickPool[Math.floor(Math.random() * randomPickPool.length)];
    const newPattern = PATTERN_ORDER[Math.floor(Math.random() * PATTERN_ORDER.length)];
    const newSeed = Date.now();
    const newSuggested = generateSuggestedDyes(
      newPrimary,
      newPattern,
      allDyes,
      newSeed,
      excludeMetallic
    );

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
