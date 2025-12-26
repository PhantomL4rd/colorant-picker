/**
 * バリデーション関連の定数
 *
 * シェア機能やカスタムカラーで使用される制限値
 */

// ===== シェア機能の制限値 =====
export const SHARE_LIMITS = {
  /** URLクエリパラメータの最大長 */
  MAX_QUERY_LENGTH: 2048,
  /** 解凍後JSONの最大長 */
  MAX_JSON_LENGTH: 10000,
} as const;

// ===== ID・名前の最大長 =====
export const ID_LIMITS = {
  /** パレットIDの最大長 */
  MAX_PALETTE_ID_LENGTH: 100,
  /** 染料IDの最大長 */
  MAX_DYE_ID_LENGTH: 100,
  /** パターン名の最大長 */
  MAX_PATTERN_LENGTH: 50,
  /** カスタムカラー名の最大長 */
  MAX_COLOR_NAME_LENGTH: 50,
} as const;

// ===== RGB値の範囲（バリデーション用） =====
export const RGB_BOUNDS = {
  MIN: 0,
  MAX: 255,
} as const;
