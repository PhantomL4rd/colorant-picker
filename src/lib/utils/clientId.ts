// クライアント識別ID管理
// 匿名ユーザーの重複投稿を防ぐためのUUID v4

import { generateId, isValidUUID } from './uuid';

const STORAGE_KEY = 'colorant-picker:client-id';

/**
 * クライアントIDを取得または生成
 * LocalStorageに保存されていれば取得、なければUUID v4を生成して保存
 */
export function getOrCreateClientId(): string {
  // ブラウザ環境チェック
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return generateId();
  }

  const existingId = localStorage.getItem(STORAGE_KEY);
  if (existingId && isValidUUID(existingId)) {
    return existingId;
  }

  const newId = generateId();
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}
