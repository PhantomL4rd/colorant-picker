/**
 * sveltekit-i18n 翻訳モジュール
 * アプリケーション全体のi18n機能を提供
 */

import i18n from 'sveltekit-i18n';
import type { Config } from 'sveltekit-i18n';
import { browser } from '$app/environment';

// サポート言語
export const SUPPORTED_LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

// デフォルト言語（フォールバック）
export const DEFAULT_LOCALE: Locale = 'en';

// 言語表示名
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

// LocalStorageキー
const STORAGE_KEY = 'colorant-picker:locale';

/**
 * ブラウザの言語設定を検出
 * サポート外の言語の場合は英語を返す
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LOCALES.includes(browserLang as Locale)
    ? (browserLang as Locale)
    : DEFAULT_LOCALE;
}

/**
 * LocalStorageから言語設定を取得
 */
export function getStoredLocale(): Locale | null {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // LocalStorageアクセス失敗時は無視
  }
  return null;
}

/**
 * 言語設定をLocalStorageに保存
 */
export function storeLocale(locale: Locale): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // 保存失敗時は無視
  }
}

/**
 * 初期言語を決定
 * 1. LocalStorageから復元
 * 2. なければブラウザ言語を検出
 * 3. 非対応言語は英語にフォールバック
 */
export function getInitialLocale(): Locale {
  const stored = getStoredLocale();
  if (stored) return stored;

  return detectBrowserLocale();
}

// sveltekit-i18n設定
const config: Config = {
  fallbackLocale: DEFAULT_LOCALE,
  log: {
    level: 'warn',
  },
  loaders: [
    // Common: 共通UI文字列（全ルートで読み込み）
    {
      locale: 'en',
      key: 'common',
      loader: async () => (await import('./en/common.json')).default,
    },
    {
      locale: 'ja',
      key: 'common',
      loader: async () => (await import('./ja/common.json')).default,
    },

    // Pattern: 配色パターン名・説明・タグ（全ルートで読み込み）
    {
      locale: 'en',
      key: 'pattern',
      loader: async () => (await import('./en/pattern.json')).default,
    },
    {
      locale: 'ja',
      key: 'pattern',
      loader: async () => (await import('./ja/pattern.json')).default,
    },

    // Dye: 染料名・カテゴリ（全ルートで読み込み）
    {
      locale: 'en',
      key: 'dye',
      loader: async () => (await import('./en/dye.json')).default,
    },
    {
      locale: 'ja',
      key: 'dye',
      loader: async () => (await import('./ja/dye.json')).default,
    },

    // Page: ページ固有の文字列
    {
      locale: 'en',
      key: 'page',
      loader: async () => (await import('./en/page.json')).default,
    },
    {
      locale: 'ja',
      key: 'page',
      loader: async () => (await import('./ja/page.json')).default,
    },
  ],
};

// sveltekit-i18nインスタンス作成
const { t, locale, locales, loading, loadTranslations: i18nLoadTranslations } = new i18n(config);

// ストアとユーティリティをエクスポート
export { t, locale, locales, loading };

/**
 * 翻訳をロード
 * レイアウトのload関数から呼び出す
 */
export async function loadTranslations(newLocale: string, pathname?: string): Promise<void> {
  await i18nLoadTranslations(newLocale, pathname);
}

/**
 * 言語を変更
 * ストア更新 + LocalStorage保存 + 翻訳再ロード
 */
export async function setLocale(newLocale: Locale): Promise<void> {
  storeLocale(newLocale);
  locale.set(newLocale);
  await loadTranslations(newLocale);
}
