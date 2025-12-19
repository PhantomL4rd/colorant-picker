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
    // D1から最新5件を取得
    const result = await env.DB.prepare(
      `SELECT id, primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, created_at
       FROM palettes
       ORDER BY created_at DESC
       LIMIT 5`
    ).all<DbPalette>();

    const palettes: ShowcasePalette[] = (result.results ?? []).map((row) => ({
      id: row.id,
      primaryDyeId: row.primary_dye_id,
      suggestedDyeIds: [row.suggested_dye_id_1, row.suggested_dye_id_2],
      pattern: row.pattern,
      createdAt: row.created_at,
    }));

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
