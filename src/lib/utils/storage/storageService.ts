/**
 * LocalStorage操作のための共通ユーティリティ
 * 型安全なlocalStorageの読み書きを提供します
 */

/**
 * LocalStorageから値を読み込む
 * @param key ストレージキー
 * @param defaultValue デフォルト値
 * @returns パースされた値またはデフォルト値
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * localStorage 容量超過エラーかどうかを判定する。
 * `name === 'QuotaExceededError'` が標準。`code === 22` はレガシー、
 * `code === 1014` / `NS_ERROR_DOM_QUOTA_REACHED` は Firefox 系の名残。
 * @param error 判定対象のエラー
 * @returns 容量超過エラーかどうか
 */
export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  );
}

/**
 * LocalStorageに値を保存する
 * @param key ストレージキー
 * @param value 保存する値
 * @returns 保存に成功したかどうか
 * @throws 容量超過エラー（DOMException）は呼び出し元で識別できるよう再throwする
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // 容量超過は呼び出し元（persistentStore）で QUOTA_EXCEEDED として扱えるよう再throwする
    if (isQuotaExceededError(error)) {
      throw error;
    }
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageから値を削除する
 * @param key ストレージキー
 * @returns 削除に成功したかどうか
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageにキーが存在するかチェック
 * @param key ストレージキー
 * @returns キーが存在するかどうか
 */
export function existsInStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Failed to check localStorage (${key}):`, error);
    return false;
  }
}
