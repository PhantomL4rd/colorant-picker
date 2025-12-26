/**
 * 色関連の定数
 *
 * マジックナンバーを排除し、色計算で使用される値を一元管理
 */

// ===== RGB値の範囲 =====
export const RGB_MIN = 0;
export const RGB_MAX = 255;

// ===== 色相環 =====
export const HUE_CIRCLE_MAX = 360;
export const HUE_DIFFERENCE_MAX = 180;

// ===== HSV範囲（パーセンテージ変換用） =====
export const HSV_PERCENT_SCALE = 100;
export const HUE_MIN = 0;
export const HUE_MAX = 360;
export const SATURATION_MIN = 0;
export const SATURATION_MAX = 100;
export const VALUE_MIN = 0;
export const VALUE_MAX = 100;

// ===== 色調和の角度定数（度） =====
export const HARMONY_ANGLES = {
  /** トライアド配色: 色相環を3等分 */
  TRIADIC_OFFSET_1: 120,
  TRIADIC_OFFSET_2: 240,

  /** 補色: 正反対 */
  COMPLEMENTARY: 180,

  /** スプリット・コンプリメンタリー: 補色の両隣 */
  SPLIT_COMPLEMENTARY_ADJUSTMENT: 30,

  /** アナログ（類似色）: 隣接する色 */
  ANALOGOUS_RANGE: 30,

  /** 類似色: より近い色相 */
  SIMILAR_RANGE: 15,

  /** コントラスト: 直角の位置 */
  CONTRAST_OFFSET: 90,
} as const;

// ===== クラッシュ配色の調整値 =====
export const CLASH_CONFIG = {
  /** 明度の閾値（OKLab L値） */
  LIGHTNESS_THRESHOLD: 0.5,
  /** 暗い色に対する目標明度 */
  TARGET_LIGHTNESS_DARK: 0.3,
  /** 明るい色に対する目標明度 */
  TARGET_LIGHTNESS_LIGHT: 0.75,

  /** 彩度の閾値（OKLCH C値） */
  CHROMA_THRESHOLD: 0.1,
  /** 低彩度時の目標彩度 */
  TARGET_CHROMA_LOW: 0.05,
  /** 高彩度時の目標彩度 */
  TARGET_CHROMA_HIGH: 0.15,
} as const;

// ===== モノクロマティック配色の設定 =====
export const MONOCHROMATIC_CONFIG = {
  /** 色相の許容範囲（度） */
  HUE_WINDOW_DEG: 35,
  /** 色相ペナルティの角度閾値（度） */
  THETA_DEG: 30,
  /** 明度のクラスタ数 */
  LIGHTNESS_BINS: 3,

  /** 重み付け */
  WEIGHTS: {
    HUE: 1.0,
    CHROMA: 0.3,
    LIGHTNESS: 0.2,
  },
} as const;

// ===== 数値計算用 =====
/** ゼロ除算対策の小さい値 */
export const EPSILON = 1e-6;
