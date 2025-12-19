// POST /api/admin/refresh-showcase - キャッシュ更新用管理エンドポイント

interface DbPalette {
  id: number;
  primary_dye_id: string;
  suggested_dye_id_1: string;
  suggested_dye_id_2: string;
  pattern: string;
  created_at: string;
}

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 認証チェック
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // D1から最新20件を取得し、ランダムで5件を選択
    const result = await env.DB.prepare(
      `SELECT id, primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, created_at
       FROM palettes
       ORDER BY created_at DESC
       LIMIT 20`
    ).all<DbPalette>();

    const allPalettes: ShowcasePalette[] = (result.results ?? []).map((row: DbPalette) => ({
      id: row.id,
      primaryDyeId: row.primary_dye_id,
      suggestedDyeIds: [row.suggested_dye_id_1, row.suggested_dye_id_2],
      pattern: row.pattern,
      createdAt: row.created_at,
    }));

    // Fisher-Yatesシャッフルでランダムに5件選択
    const shuffled = [...allPalettes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const palettes = shuffled.slice(0, 5);

    const showcaseData: ShowcaseData = {
      palettes,
      updatedAt: new Date().toISOString(),
    };

    // KVに保存
    await env.KV.put('showcase:latest', JSON.stringify(showcaseData));

    return Response.json({
      ok: true,
      count: palettes.length,
      updatedAt: showcaseData.updatedAt,
    });
  } catch (error) {
    console.error('Error refreshing showcase:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
