// パレット投稿サービス
// お気に入り追加時にサーバーへ投稿

import type { DyeProps, HarmonyPattern } from '$lib/types';
import { getOrCreateClientId } from './clientId';

interface SubmitPaletteInput {
  primaryDye: DyeProps;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
}

/**
 * パレットをサーバーに投稿
 * 失敗してもエラーを投げず、サイレントにログを記録
 */
export async function submitPalette(input: SubmitPaletteInput): Promise<void> {
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
