// クライアント識別ID管理
// 匿名ユーザーの重複投稿を防ぐためのUUID v4

const STORAGE_KEY = 'colorant-picker:client-id';

/**
 * クライアントIDを取得または生成
 * LocalStorageに保存されていれば取得、なければUUID v4を生成して保存
 */
export function getOrCreateClientId(): string {
  // ブラウザ環境チェック
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return crypto.randomUUID();
  }

  const existingId = localStorage.getItem(STORAGE_KEY);
  if (existingId && isValidUUID(existingId)) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

/**
 * UUID v4形式のバリデーション
 */
function isValidUUID(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
