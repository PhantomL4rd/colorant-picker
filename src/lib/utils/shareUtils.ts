/**
 * シェアユーティリティ
 *
 * culori型を直接使用。共有データは0-255範囲で保存。
 */

import LZString from 'lz-string';
import { Palette } from '$lib/models/Palette';
import { emitRestorePalette } from '$lib/stores/paletteEvents';
import type { DyeProps, Favorite, HarmonyPattern } from '$lib/types';
import { generateSuggestedDyes } from '$lib/utils/color/colorHarmony';
import { ID_LIMITS, SHARE_LIMITS } from '$lib/constants/validation';

const BASE_URL_FOR_SHARE = 'https://colorant-picker.pl4rd.com/share';

function isValidString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

interface SharePaletteData {
  p: string; // primary dye id
  s: [string, string]; // secondary dye ids
  pt: HarmonyPattern; // pattern type
}

/**
 * お気に入りからシェア用URLを生成
 * suggestedDyesはPaletteで役割順（サブ→アクセント）にソートしてからエンコードする。
 * これによりWorker側でソート不要になる。
 */
export function generateShareUrl(favorite: Favorite): string {
  const palette = new Palette(favorite.primaryDye, favorite.suggestedDyes, favorite.pattern);
  const sortedSuggested = [palette.sub.dye, palette.accent.dye];

  const data: SharePaletteData = {
    p: favorite.primaryDye.id,
    s: [sortedSuggested[0].id, sortedSuggested[1].id],
    pt: favorite.pattern,
  };

  try {
    const jsonString = JSON.stringify(data);
    const compressedData = LZString.compressToEncodedURIComponent(jsonString);
    return `${BASE_URL_FOR_SHARE}/${compressedData}`;
  } catch (error) {
    console.error('Failed to generate share URL:', error);
    return window.location.href;
  }
}

/**
 * URLからパレットデータを復元
 */
export function decodePaletteFromUrl(url: string): SharePaletteData | null {
  try {
    const urlObj = new URL(url);
    const paletteParam = urlObj.searchParams.get('palette');

    // 長さ制限チェック
    if (!paletteParam || paletteParam.length > SHARE_LIMITS.MAX_QUERY_LENGTH) {
      return null;
    }

    // 圧縮されたデータを解凍
    const jsonString = LZString.decompressFromEncodedURIComponent(paletteParam);

    // 解凍後の長さ制限チェック
    if (!jsonString || jsonString.length > SHARE_LIMITS.MAX_JSON_LENGTH) {
      console.warn('Failed to decompress or decompressed data too large');
      return null;
    }

    const data = JSON.parse(jsonString) as SharePaletteData;

    // 厳密な型・構造チェック
    if (
      !isValidString(data.p, ID_LIMITS.MAX_PALETTE_ID_LENGTH) ||
      !Array.isArray(data.s) ||
      data.s.length !== 2 ||
      !isValidString(data.s[0], ID_LIMITS.MAX_DYE_ID_LENGTH) ||
      !isValidString(data.s[1], ID_LIMITS.MAX_DYE_ID_LENGTH) ||
      !isValidString(data.pt, ID_LIMITS.MAX_PATTERN_LENGTH)
    ) {
      console.warn('Invalid palette data structure or value');
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to decode palette from URL:', error);
    return null;
  }
}

/**
 * クリップボードにコピー（フォールバック付き）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * URLパラメータからパレットを復元してストアに設定
 */
export function restorePaletteFromUrl(dyes: DyeProps[]): boolean {
  try {
    const data = decodePaletteFromUrl(window.location.href);
    if (data) {
      // 染料IDから実際のDyeオブジェクトを検索
      const primaryDye = dyes.find((dye) => dye.id === data.p);
      const secondaryDye1 = dyes.find((dye) => dye.id === data.s[0]);
      const secondaryDye2 = dyes.find((dye) => dye.id === data.s[1]);

      if (!primaryDye || !secondaryDye1 || !secondaryDye2) {
        console.warn('Some dyes not found:', {
          primary: data.p,
          secondary: data.s,
          found: { primaryDye, secondaryDye1, secondaryDye2 },
        });
        return false;
      }

      emitRestorePalette({
        primaryDye,
        suggestedDyes: [secondaryDye1, secondaryDye2],
        pattern: data.pt,
      });

      // URLパラメータをクリーンアップ
      const url = new URL(window.location.href);
      url.searchParams.delete('palette');
      window.history.replaceState({}, '', url.toString());

      return true;
    }

    // 外部アプリ連携: ?dye=dye_002 パラメータ
    const dyeParam = new URL(window.location.href).searchParams.get('dye');
    if (dyeParam) {
      if (dyeParam.length > ID_LIMITS.MAX_DYE_ID_LENGTH) return false;

      const targetDye = dyes.find((d) => d.id === dyeParam);
      if (!targetDye) {
        console.warn('Dye not found for param:', dyeParam);
        return false;
      }

      const patterns: HarmonyPattern[] = [
        'triadic',
        'split-complementary',
        'analogous',
        'monochromatic',
        'similar',
        'contrast',
        'clash',
      ];
      const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
      const suggested = generateSuggestedDyes(targetDye, randomPattern, dyes);

      emitRestorePalette({
        primaryDye: targetDye,
        suggestedDyes: suggested,
        pattern: randomPattern,
      });

      // URLパラメータをクリーンアップ
      const url = new URL(window.location.href);
      url.searchParams.delete('dye');
      window.history.replaceState({}, '', url.toString());

      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to restore palette from URL:', error);
    return false;
  }
}
