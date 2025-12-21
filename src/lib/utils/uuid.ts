/**
 * UUID生成ユーティリティ
 * アプリケーション全体で使用するUUID v4生成と検証機能を提供
 */

/** UUID v4フォーマットの正規表現 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * UUID v4を生成する
 * crypto.randomUUID()が利用可能な場合は標準APIを使用
 * 利用不可の場合はフォールバック実装を使用
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 古いブラウザ向けフォールバック
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * UUID v4形式のバリデーション
 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}
