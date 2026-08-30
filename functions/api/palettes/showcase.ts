// GET /api/palettes/showcase - おすすめパレット取得エンドポイント

interface ShowcasePalette {
  id: number;
  primaryDyeId: string;
  suggestedDyeIds: [string, string];
  pattern: string;
  createdAt: string;
}

interface ShowcaseData {
  palettes: ShowcasePalette[];
  updatedAt: string;
}

interface DbPalette {
  id: number;
  primary_dye_id: string;
  suggested_dye_id_1: string;
  suggested_dye_id_2: string;
  pattern: string;
  created_at: string;
}

const SHOWCASE = {
  FETCH_LIMIT: 10,
  DISPLAY_COUNT: 5,
  CACHE_TTL_SECONDS: 2 * 24 * 60 * 60,
} as const;

/** UTCの日付から決定的な乱数を作る。UTC 0:00（JST 9:00）に表示内容が切り替わる。 */
function createDailyRandom(date: string): () => number {
  let seed = 2166136261;
  for (const character of date) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

async function buildShowcase(env: Env, date: string): Promise<ShowcaseData> {
  const result = await env.DB.prepare(
    `SELECT MAX(id) as id, primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, MAX(created_at) as created_at
     FROM palettes
     GROUP BY primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern
     ORDER BY MAX(created_at) DESC
     LIMIT ?`
  )
    .bind(SHOWCASE.FETCH_LIMIT)
    .all<DbPalette>();

  const palettes: ShowcasePalette[] = (result.results ?? []).map((row) => ({
    id: row.id,
    primaryDyeId: row.primary_dye_id,
    suggestedDyeIds: [row.suggested_dye_id_1, row.suggested_dye_id_2],
    pattern: row.pattern,
    createdAt: row.created_at,
  }));

  const random = createDailyRandom(date);
  for (let index = palettes.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [palettes[index], palettes[target]] = [palettes[target], palettes[index]];
  }

  return {
    palettes: palettes.slice(0, SHOWCASE.DISPLAY_COUNT),
    updatedAt: new Date().toISOString(),
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const date = new Date().toISOString().slice(0, 10);
  const cacheKey = `showcase:daily:${date}`;

  try {
    const cached = await context.env.KV.get<ShowcaseData>(cacheKey, 'json');
    if (cached) return Response.json(cached);

    const data = await buildShowcase(context.env, date);
    await context.env.KV.put(cacheKey, JSON.stringify(data), {
      expirationTtl: SHOWCASE.CACHE_TTL_SECONDS,
    });

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return Response.json({ palettes: [], updatedAt: null });
  }
};
