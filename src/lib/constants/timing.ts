/**
 * アニメーション・タイミング関連の定数
 *
 * UI操作のフィードバックやアニメーション時間を一元管理
 */

// ===== フィードバック表示時間（ms） =====
export const FEEDBACK_DURATION = {
  /** ボタンフィードバック */
  BUTTON: 800,
  /** コピー成功表示 */
  COPY_SUCCESS: 2000,
} as const;

// ===== トースト通知（ms） =====
export const TOAST_TIMING = {
  /** 表示時間 */
  DISPLAY_DURATION: 2500,
  /** フェードアウト時間 */
  FADE_DURATION: 200,
} as const;

// ===== スクロール・フォーカス（ms） =====
export const SCROLL_TIMING = {
  /** スクロール待機時間 */
  SCROLL_DELAY: 100,
  /** コーチマークのスクロール待機 */
  COACH_MARK_SCROLL_DELAY: 300,
  /** フォーカス待機時間 */
  FOCUS_DELAY: 100,
} as const;

// ===== ハートバースト =====
export const HEART_BURST = {
  /** 最小個数 */
  MIN_COUNT: 2,
  /** ランダム追加範囲 */
  RANDOM_RANGE: 2,
  /** 消滅時間（ms） */
  DURATION: 600,
  /** 水平オフセット範囲（px） */
  X_RANGE: 24,
  /** 垂直オフセットベース（px） */
  Y_BASE: 25,
  /** 垂直オフセット変動幅（px） */
  Y_VARIATION: 15,
} as const;

// ===== Z-index =====
export const Z_INDEX = {
  /** トースト通知 */
  TOAST: 50,
  /** スポットライト背景 */
  SPOTLIGHT: 1000,
  /** コーチマークオーバーレイ */
  COACH_MARK_OVERLAY: 1001,
} as const;
