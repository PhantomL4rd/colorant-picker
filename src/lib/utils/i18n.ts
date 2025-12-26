/**
 * i18n ユーティリティ関数
 * Lodestone URL生成
 */

import type { Locale } from '$lib/types';
import { LODESTONE_DOMAINS } from '$lib/types';

/**
 * Lodestone URLを生成
 * 言語に応じたドメインを使用
 */
export function getLodestoneUrl(path: string, locale: Locale): string {
  const domain = LODESTONE_DOMAINS[locale] ?? LODESTONE_DOMAINS.en;
  return `https://${domain}${path}`;
}
