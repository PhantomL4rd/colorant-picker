/**
 * 3色パレットの役割判定と使用比率（黄金比）計算
 *
 * 基礎ウェイト（補正なしで約70:25:5）:
 * - メイン: 1.0
 * - サブ: 0.357
 * - アクセント: 0.071
 *
 * 非線形補正:
 * effectiveWeight = baseWeight * exp(-k * deltaE)
 * where k = 2.5 (SUPPRESSION_FACTOR)
 */

import type { DyeProps, RGBColor, ColorRole, ColorRatioResult } from '$lib/types';
import {
  useMode,
  modeRgb,
  modeOklch,
  differenceEuclidean,
} from 'culori/fn';
import type { Oklch } from 'culori/fn';
import { rgbToOklch } from './colorConversion';

// 使用する色空間を登録（colorConversion.tsでも登録済みだが念のため）
useMode(modeRgb);
useMode(modeOklch);

// ===== 定数 =====

// デフォルト比率（黄金比 70:25:5）
export const DEFAULT_RATIO = {
  main: 70,
  sub: 25,
  accent: 5,
} as const;

// ベースウェイト（70:25:5を実現する比率）
export const BASE_WEIGHTS = {
  main: 1.0,
  sub: 0.357,    // サブ (25/70)
  accent: 0.071, // アクセント (5/70)
} as const;

export const SUPPRESSION_FACTOR = 2.5; // 非線形補正の係数k

// ===== 色差計算 =====

const deltaEFn = differenceEuclidean('oklch');

/**
 * 2色間のOKLCH色差（deltaE）を計算
 */
export function calculateDeltaE(main: RGBColor, other: RGBColor): number {
  const mainOklch = rgbToOklch(main);
  const otherOklch = rgbToOklch(other);

  const culoriMain: Oklch = { mode: 'oklch', l: mainOklch.L, c: mainOklch.C, h: mainOklch.h };
  const culoriOther: Oklch = { mode: 'oklch', l: otherOklch.L, c: otherOklch.C, h: otherOklch.h };

  return deltaEFn(culoriMain, culoriOther);
}

// ===== メイン関数 =====

/**
 * 3色パレットの役割と使用比率を計算
 *
 * @param colors 3色のDyeProps配列 [primaryDye, suggestedDye1, suggestedDye2]
 * @returns 各色の役割と使用比率
 */
export function calculateColorRatio(
  colors: [DyeProps, DyeProps, DyeProps]
): [ColorRatioResult, ColorRatioResult, ColorRatioResult] {
  try {
    const [main, color1, color2] = colors;

    // メインからの色差を計算
    const deltaE1 = calculateDeltaE(main.rgb, color1.rgb);
    const deltaE2 = calculateDeltaE(main.rgb, color2.rgb);

    // 役割判定：色差が小さい方がサブ、大きい方がアクセント
    let subColor: DyeProps;
    let accentColor: DyeProps;
    let subDeltaE: number;
    let accentDeltaE: number;

    if (deltaE1 <= deltaE2) {
      subColor = color1;
      accentColor = color2;
      subDeltaE = deltaE1;
      accentDeltaE = deltaE2;
    } else {
      subColor = color2;
      accentColor = color1;
      subDeltaE = deltaE2;
      accentDeltaE = deltaE1;
    }

    // 非線形補正を適用したウェイト計算
    const mainWeight = BASE_WEIGHTS.main;
    const subWeight = BASE_WEIGHTS.sub * Math.exp(-SUPPRESSION_FACTOR * subDeltaE);
    const accentWeight = BASE_WEIGHTS.accent * Math.exp(-SUPPRESSION_FACTOR * accentDeltaE);

    // 正規化して比率を計算
    const totalWeight = mainWeight + subWeight + accentWeight;
    const rawMainPercent = (mainWeight / totalWeight) * 100;
    const rawSubPercent = (subWeight / totalWeight) * 100;
    const rawAccentPercent = (accentWeight / totalWeight) * 100;

    // 四捨五入して整数化
    let mainPercent = Math.round(rawMainPercent);
    let subPercent = Math.round(rawSubPercent);
    let accentPercent = Math.round(rawAccentPercent);

    // 合計が100%になるように調整（最大の値で調整）
    const total = mainPercent + subPercent + accentPercent;
    if (total !== 100) {
      const diff = 100 - total;
      mainPercent += diff;
    }

    return [
      { dyeId: main.id, role: 'メイン' as ColorRole, percent: mainPercent },
      { dyeId: subColor.id, role: 'サブ' as ColorRole, percent: subPercent },
      { dyeId: accentColor.id, role: 'アクセント' as ColorRole, percent: accentPercent },
    ];
  } catch {
    // エラー時はデフォルト比率を返す
    return [
      { dyeId: colors[0].id, role: 'メイン' as ColorRole, percent: DEFAULT_RATIO.main },
      { dyeId: colors[1].id, role: 'サブ' as ColorRole, percent: DEFAULT_RATIO.sub },
      { dyeId: colors[2].id, role: 'アクセント' as ColorRole, percent: DEFAULT_RATIO.accent },
    ];
  }
}

/**
 * 役割でソートされた結果を取得（メイン→サブ→アクセントの順）
 */
export function getSortedByRole(
  results: [ColorRatioResult, ColorRatioResult, ColorRatioResult]
): [ColorRatioResult, ColorRatioResult, ColorRatioResult] {
  const roleOrder: Record<ColorRole, number> = {
    'メイン': 0,
    'サブ': 1,
    'アクセント': 2,
  };

  const sorted = [...results].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  return sorted as [ColorRatioResult, ColorRatioResult, ColorRatioResult];
}

/**
 * dyeIdで結果を検索
 */
export function findByDyeId(
  results: [ColorRatioResult, ColorRatioResult, ColorRatioResult],
  dyeId: string
): ColorRatioResult | undefined {
  return results.find((r) => r.dyeId === dyeId);
}
