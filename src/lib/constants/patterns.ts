import type { HarmonyPattern } from '$lib/types';

// パターン表示順（UI全体で共有）
// tint / shade は明度系として contrast の後ろに配置。clash は最後。
export const PATTERN_ORDER: HarmonyPattern[] = [
  'triadic',
  'split-complementary',
  'analogous',
  'monochromatic',
  'similar',
  'contrast',
  'tint',
  'shade',
  'clash',
];
