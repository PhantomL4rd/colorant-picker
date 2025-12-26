import { browser } from '$app/environment';
import { loadTranslations, getInitialLocale } from '$lib/translations';

export const prerender = true;

export const load = async ({ url }) => {
  // 初期言語を決定してロード
  const initLocale = browser ? getInitialLocale() : 'en';
  await loadTranslations(initLocale, url.pathname);
  return {};
};
