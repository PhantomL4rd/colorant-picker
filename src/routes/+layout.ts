import { getInitialLocale, loadTranslations } from '#lib/translations/index.js';
import { browser } from '$app/env';

export const prerender = true;

export const load = async ({ url }) => {
  // 初期言語を決定してロード
  const initLocale = browser ? getInitialLocale() : 'en';
  await loadTranslations(initLocale, url.pathname);
  return {};
};
