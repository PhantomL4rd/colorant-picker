// POST /api/palettes - パレット投稿エンドポイント

interface SubmitPaletteRequest {
  primaryDyeId: string;
  suggestedDyeIds: [string, string];
  pattern: string;
  clientId: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DYE_ID_REGEX = /^[a-z0-9-]+$/;
const VALID_PATTERNS = ['triadic', 'splitComplementary', 'analogous', 'monochromatic'];

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
    req.suggestedDyeIds.length !== 2 ||
    !req.suggestedDyeIds.every((id) => typeof id === 'string' && DYE_ID_REGEX.test(id))
  ) {
    return null;
  }

  // pattern validation
  if (typeof req.pattern !== 'string' || !VALID_PATTERNS.includes(req.pattern)) {
    return null;
  }

  // clientId validation (UUID v4)
  if (typeof req.clientId !== 'string' || !UUID_REGEX.test(req.clientId)) {
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
