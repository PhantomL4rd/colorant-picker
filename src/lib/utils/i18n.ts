/**
 * i18n ユーティリティ関数
 * 染料名・カテゴリ名の翻訳とLodestone URL生成
 */

import type { DyeCategory, DyeTranslations, Locale } from '$lib/types';
import { LODESTONE_DOMAINS } from '$lib/types';

// サポート言語リスト
export const SUPPORTED_LOCALES: Locale[] = ['en', 'ja'];

// デフォルト言語
export const DEFAULT_LOCALE: Locale = 'en';

// 言語表示名
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

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
 * 染料名を翻訳
 * 翻訳がない場合は英語ベース名にフォールバック
 */
export function translateDyeName(
  dyeId: string,
  baseName: string,
  translations: DyeTranslations | null
): string {
  if (!translations) return baseName;
  return translations.dyes[dyeId] ?? baseName;
}

/**
 * カテゴリを翻訳
 * 翻訳がない場合はカテゴリキーをそのまま返す
 */
export function translateCategory(
  categoryKey: DyeCategory,
  translations: DyeTranslations | null
): string {
  if (!translations) return categoryKey;
  return translations.categories[categoryKey] ?? categoryKey;
}

/**
 * Lodestone URLを生成
 * 言語に応じたドメインを使用
 */
export function getLodestoneUrl(path: string, locale: Locale): string {
  const domain = LODESTONE_DOMAINS[locale] ?? LODESTONE_DOMAINS.en;
  return `https://${domain}${path}`;
}

/**
 * 英語のカテゴリ翻訳（デフォルト）
 * 翻訳ファイルをロードせずに使用可能
 */
export const EN_CATEGORY_TRANSLATIONS: Record<DyeCategory, string> = {
  white: 'White',
  red: 'Red',
  brown: 'Brown',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  rare: 'Special',
};
