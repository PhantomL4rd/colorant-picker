/**
 * 言語設定ストア
 * 現在の言語を管理し、LocalStorageに永続化
 */

import { writable, derived, get } from 'svelte/store';
import type { DyeTranslations, Locale } from '$lib/types';
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  SUPPORTED_LOCALES,
  EN_CATEGORY_TRANSLATIONS,
} from '$lib/utils/i18n';

// ===== 定数 =====

const STORAGE_KEY = 'colorant-picker:locale';
// BASE_URLは必ずスラッシュで終わる（例: '/' または '/colorant-picker/'）
const BASE_PATH = import.meta.env.BASE_URL || '/';

// ===== 言語ストア =====

/**
 * 言語設定を初期化
 * 1. LocalStorageから復元
 * 2. なければブラウザ言語を検出
 * 3. 非対応言語は英語にフォールバック
 */
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // LocalStorageアクセス失敗時は無視
  }

  return detectBrowserLocale();
}

/** 現在の言語設定 */
export const localeStore = writable<Locale>(getInitialLocale());

// LocalStorage同期
if (typeof window !== 'undefined') {
  localeStore.subscribe((locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // 保存失敗時は無視
    }
  });
}

// ===== 翻訳ストア =====

/** 翻訳データキャッシュ */
const translationCache = new Map<Locale, DyeTranslations>();

/** 翻訳データストア */
export const translationsStore = writable<DyeTranslations | null>(null);

/** 翻訳データのロード状態 */
export const translationsLoadingStore = writable<boolean>(false);

/**
 * 翻訳データをロード
 * 英語の場合はロードせず、dyes.jsonのベース名を使用
 */
export async function loadTranslations(locale: Locale): Promise<void> {
  // 英語はベースなので翻訳不要
  if (locale === 'en') {
    // 英語カテゴリ翻訳のみ設定
    translationsStore.set({
      dyes: {},
      categories: EN_CATEGORY_TRANSLATIONS,
    });
    return;
  }

  // キャッシュチェック
  const cached = translationCache.get(locale);
  if (cached) {
    translationsStore.set(cached);
    return;
  }

  // 翻訳ファイルをフェッチ
  translationsLoadingStore.set(true);
  try {
    const response = await fetch(`${BASE_PATH}data/i18n/${locale}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations: ${response.status}`);
    }

    const data: DyeTranslations = await response.json();
    translationCache.set(locale, data);
    translationsStore.set(data);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // フォールバック: 英語カテゴリ翻訳のみ
    translationsStore.set({
      dyes: {},
      categories: EN_CATEGORY_TRANSLATIONS,
    });
  } finally {
    translationsLoadingStore.set(false);
  }
}

/**
 * 言語を変更
 * ストア更新と翻訳ロードを同時に実行
 */
export async function setLocale(locale: Locale): Promise<void> {
  localeStore.set(locale);
  await loadTranslations(locale);
}

/**
 * 現在の言語を取得（同期的）
 */
export function getCurrentLocale(): Locale {
  return get(localeStore);
}

/**
 * 初期化（アプリ起動時に呼び出す）
 */
export async function initLocale(): Promise<void> {
  const locale = get(localeStore);
  await loadTranslations(locale);
}
