// パレット投稿サービス
// お気に入り追加時にサーバーへ投稿（カスタムカラー除く）

import type { DyeProps, HarmonyPattern } from '$lib/types';
import { getOrCreateClientId } from './clientId';
import { isCustomDye } from '../color/customColorUtils';

interface SubmitPaletteInput {
  primaryDye: DyeProps;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
}

/**
 * パレットに含まれる染料がカスタムカラーを含むかチェック
 */
export function containsCustomColor(input: SubmitPaletteInput): boolean {
  return (
    isCustomDye(input.primaryDye) ||
    isCustomDye(input.suggestedDyes[0]) ||
    isCustomDye(input.suggestedDyes[1])
  );
}

/**
 * パレットをサーバーに投稿
 * カスタムカラーを含む場合は投稿しない
 * 失敗してもエラーを投げず、サイレントにログを記録
 */
export async function submitPalette(input: SubmitPaletteInput): Promise<void> {
  // カスタムカラーを含む場合は投稿しない
  if (containsCustomColor(input)) {
    return;
  }

  try {
    const clientId = getOrCreateClientId();

    // HarmonyPatternをAPI用に変換（split-complementary → splitComplementary）
    const patternForApi = input.pattern.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

    const response = await fetch('/api/palettes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryDyeId: input.primaryDye.id,
        suggestedDyeIds: [input.suggestedDyes[0].id, input.suggestedDyes[1].id],
        pattern: patternForApi,
        clientId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to submit palette:', response.status);
    }
  } catch (error) {
    // サイレント失敗：ローカル保存は継続させるため、エラーはログに記録のみ
    console.error('Error submitting palette:', error);
  }
}
