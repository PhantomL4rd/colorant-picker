import type { HarmonyPattern, DyeProps } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/colorHarmony';

// パターンのビジュアルデータ
export interface PatternVisual {
  pattern: HarmonyPattern;
  label: string;
  description: string;
  sampleColors: [string, string, string]; // サンプル色（表示用）
  colorWheelAngles: [number, number, number]; // カラーホイール上の角度（0-360）
  isPopular?: boolean; // 人気バッジ
}

// パターン名のマッピング
export const PATTERN_LABELS: Record<HarmonyPattern, string> = {
  triadic: 'バランス',
  'split-complementary': 'アクセント',
  analogous: 'グラデーション',
  monochromatic: '同系色',
  similar: 'ナチュラル',
  contrast: 'コントラスト',
  clash: 'クラッシュ',
};

// パターンの説明
export const PATTERN_DESCRIPTIONS: Record<HarmonyPattern, string> = {
  triadic: 'バランスよく調和した鮮やかな3色',
  'split-complementary': 'メインカラーに映える個性的な3色',
  analogous: '自然につながる優しい3色',
  monochromatic: '統一感のある落ち着いた3色',
  similar: '馴染みやすい近い色味の3色',
  contrast: 'はっきりとした対比のある3色',
  clash: 'ガウガウ元気になる3色',
};

// パターンの配列（セレクトボックス用）
export const PATTERN_OPTIONS: Array<{
  value: HarmonyPattern;
  label: string;
  description: string;
}> = [
  {
    value: 'triadic',
    label: PATTERN_LABELS.triadic,
    description: PATTERN_DESCRIPTIONS.triadic,
  },
  {
    value: 'split-complementary',
    label: PATTERN_LABELS['split-complementary'],
    description: PATTERN_DESCRIPTIONS['split-complementary'],
  },
  {
    value: 'analogous',
    label: PATTERN_LABELS.analogous,
    description: PATTERN_DESCRIPTIONS.analogous,
  },
  {
    value: 'monochromatic',
    label: PATTERN_LABELS.monochromatic,
    description: PATTERN_DESCRIPTIONS.monochromatic,
  },
  {
    value: 'similar',
    label: PATTERN_LABELS.similar,
    description: PATTERN_DESCRIPTIONS.similar,
  },
  {
    value: 'contrast',
    label: PATTERN_LABELS.contrast,
    description: PATTERN_DESCRIPTIONS.contrast,
  },
  {
    value: 'clash',
    label: PATTERN_LABELS.clash,
    description: PATTERN_DESCRIPTIONS.clash,
  },
];

// グループ化されたパターン配列
export const GROUPED_PATTERN_OPTIONS = [
  {
    groupLabel: '定番の配色',
    patterns: [
      {
        value: 'triadic',
        label: PATTERN_LABELS.triadic,
        description: PATTERN_DESCRIPTIONS.triadic,
      },
      {
        value: 'split-complementary',
        label: PATTERN_LABELS['split-complementary'],
        description: PATTERN_DESCRIPTIONS['split-complementary'],
      },
      {
        value: 'analogous',
        label: PATTERN_LABELS.analogous,
        description: PATTERN_DESCRIPTIONS.analogous,
      },
      {
        value: 'monochromatic',
        label: PATTERN_LABELS.monochromatic,
        description: PATTERN_DESCRIPTIONS.monochromatic,
      },
      {
        value: 'similar',
        label: PATTERN_LABELS.similar,
        description: PATTERN_DESCRIPTIONS.similar,
      },
      {
        value: 'contrast',
        label: PATTERN_LABELS.contrast,
        description: PATTERN_DESCRIPTIONS.contrast,
      },
    ],
  },
  {
    groupLabel: '個性派の配色',
    patterns: [
      {
        value: 'clash',
        label: PATTERN_LABELS.clash,
        description: PATTERN_DESCRIPTIONS.clash,
      },
    ],
  },
] as const;

// パターンラベルを取得する関数
export function getPatternLabel(pattern: HarmonyPattern): string {
  return PATTERN_LABELS[pattern] || pattern;
}

// パターン説明を取得する関数
export function getPatternDescription(pattern: HarmonyPattern): string {
  return PATTERN_DESCRIPTIONS[pattern] || '';
}

// パターンのビジュアルデータ配列
export const PATTERN_VISUALS: PatternVisual[] = [
  {
    pattern: 'triadic',
    label: PATTERN_LABELS.triadic,
    description: PATTERN_DESCRIPTIONS.triadic,
    sampleColors: ['#E63946', '#457B9D', '#F4A261'],
    colorWheelAngles: [0, 120, 240],
    isPopular: true,
  },
  {
    pattern: 'split-complementary',
    label: PATTERN_LABELS['split-complementary'],
    description: PATTERN_DESCRIPTIONS['split-complementary'],
    sampleColors: ['#6A4C93', '#C9E4CA', '#F7B267'],
    colorWheelAngles: [0, 150, 210],
  },
  {
    pattern: 'analogous',
    label: PATTERN_LABELS.analogous,
    description: PATTERN_DESCRIPTIONS.analogous,
    sampleColors: ['#3A86FF', '#5390D9', '#7FB3D5'],
    colorWheelAngles: [0, 30, 60],
    isPopular: true,
  },
  {
    pattern: 'monochromatic',
    label: PATTERN_LABELS.monochromatic,
    description: PATTERN_DESCRIPTIONS.monochromatic,
    sampleColors: ['#2D6A4F', '#40916C', '#74C69D'],
    colorWheelAngles: [0, 0, 0],
  },
  {
    pattern: 'similar',
    label: PATTERN_LABELS.similar,
    description: PATTERN_DESCRIPTIONS.similar,
    sampleColors: ['#FFBE0B', '#FB5607', '#FF8FA3'],
    colorWheelAngles: [0, 15, 30],
  },
  {
    pattern: 'contrast',
    label: PATTERN_LABELS.contrast,
    description: PATTERN_DESCRIPTIONS.contrast,
    sampleColors: ['#1D3557', '#E63946', '#F1FAEE'],
    colorWheelAngles: [0, 180, 90],
  },
  {
    pattern: 'clash',
    label: PATTERN_LABELS.clash,
    description: PATTERN_DESCRIPTIONS.clash,
    sampleColors: ['#FF006E', '#8338EC', '#3A86FF'],
    colorWheelAngles: [0, 90, 270],
  },
];

/**
 * 実際のカララントを使ってパターンのサンプル色を生成
 * @param baseDye 基準となるカララント
 * @param allDyes 全カララント
 * @returns パターンごとのサンプル色マップ
 */
export function generatePatternSamplesFromDyes(
  baseDye: DyeProps,
  allDyes: DyeProps[]
): Map<HarmonyPattern, [string, string, string]> {
  const samples = new Map<HarmonyPattern, [string, string, string]>();
  const patterns: HarmonyPattern[] = [
    'triadic',
    'split-complementary',
    'analogous',
    'monochromatic',
    'similar',
    'contrast',
    'clash',
  ];

  for (const pattern of patterns) {
    const [sub, accent] = generateSuggestedDyes(baseDye, pattern, allDyes);
    samples.set(pattern, [baseDye.hex, sub.hex, accent.hex]);
  }

  return samples;
}

/**
 * 実際のカララントでパターンビジュアルを生成
 */
export function generatePatternVisualsWithDyes(
  baseDye: DyeProps,
  allDyes: DyeProps[]
): PatternVisual[] {
  const samples = generatePatternSamplesFromDyes(baseDye, allDyes);

  return PATTERN_VISUALS.map((visual) => ({
    ...visual,
    sampleColors: samples.get(visual.pattern) ?? visual.sampleColors,
  }));
}
