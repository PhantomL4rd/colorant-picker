// POST /api/palettes - パレット投稿エンドポイント

interface SubmitPaletteRequest {
  primaryDyeId: string;
  suggestedDyeIds: [string, string];
  pattern: string;
  clientId: string;
}

// ===== 定数 =====
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DYE_ID_REGEX = /^[a-z0-9_-]+$/;
const VALID_PATTERNS = [
  'triadic',
  'split-complementary',
  'analogous',
  'monochromatic',
  'similar',
  'contrast',
  'clash',
] as const;

/** 提案色の数 */
const SUGGESTED_DYE_COUNT = 2;

// レート制限設定
const RATE_LIMIT = {
  /** ウィンドウ（ミリ秒）: 1分 */
  WINDOW_MS: 60 * 1000,
  /** 最大リクエスト数 */
  MAX_REQUESTS: 5,
  /** KVのTTL（秒） */
  TTL_SECONDS: 60,
} as const;

function validateRequest(body: unknown): SubmitPaletteRequest | null {
  if (!body || typeof body !== 'object') return null;

  const req = body as Record<string, unknown>;

  // primaryDyeId validation
  if (typeof req.primaryDyeId !== 'string' || !DYE_ID_REGEX.test(req.primaryDyeId)) {
    return null;
  }

  // suggestedDyeIds validation
  if (
    !Array.isArray(req.suggestedDyeIds) ||
    req.suggestedDyeIds.length !== SUGGESTED_DYE_COUNT ||
    !req.suggestedDyeIds.every((id) => typeof id === 'string' && DYE_ID_REGEX.test(id))
  ) {
    return null;
  }

  // pattern validation
  if (typeof req.pattern !== 'string' || !VALID_PATTERNS.includes(req.pattern as typeof VALID_PATTERNS[number])) {
    return null;
  }

  // clientId validation (UUID v4)
  if (typeof req.clientId !== 'string' || !UUID_V4_REGEX.test(req.clientId)) {
    return null;
  }

  return {
    primaryDyeId: req.primaryDyeId,
    suggestedDyeIds: req.suggestedDyeIds as [string, string],
    pattern: req.pattern,
    clientId: req.clientId,
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const validated = validateRequest(body);

    if (!validated) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // レート制限チェック（KVを使用）
    const rateLimitKey = `ratelimit:${validated.clientId}`;
    const rateLimitData = await env.KV.get(rateLimitKey);

    if (rateLimitData) {
      const { count, timestamp } = JSON.parse(rateLimitData);
      const elapsed = Date.now() - timestamp;

      if (elapsed < RATE_LIMIT.WINDOW_MS) {
        if (count >= RATE_LIMIT.MAX_REQUESTS) {
          return Response.json(
            { error: 'Rate limit exceeded. Please wait a moment.' },
            { status: 429 }
          );
        }
        // カウント増加
        await env.KV.put(rateLimitKey, JSON.stringify({ count: count + 1, timestamp }), {
          expirationTtl: RATE_LIMIT.TTL_SECONDS,
        });
      } else {
        // ウィンドウリセット
        await env.KV.put(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }), {
          expirationTtl: RATE_LIMIT.TTL_SECONDS,
        });
      }
    } else {
      // 初回
      await env.KV.put(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }), {
        expirationTtl: RATE_LIMIT.TTL_SECONDS,
      });
    }

    // INSERT OR IGNORE で重複は無視
    await env.DB.prepare(
      `INSERT OR IGNORE INTO palettes
       (primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, client_id)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        validated.primaryDyeId,
        validated.suggestedDyeIds[0],
        validated.suggestedDyeIds[1],
        validated.pattern,
        validated.clientId
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error saving palette:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
