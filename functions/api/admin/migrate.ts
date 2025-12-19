// 一時的なマイグレーションエンドポイント（デバッグ用）
// 本番では削除すること

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // テーブル作成
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS palettes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        primary_dye_id TEXT NOT NULL,
        suggested_dye_id_1 TEXT NOT NULL,
        suggested_dye_id_2 TEXT NOT NULL,
        pattern TEXT NOT NULL,
        client_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // インデックス作成
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_palettes_created_at ON palettes(created_at DESC)`).run();

    // シードデータ投入（5件）
    const seedPalettes = [
      { primary: 'dye_009', suggested1: 'dye_071', suggested2: 'dye_069', pattern: 'clash' },
      { primary: 'dye_034', suggested1: 'dye_004', suggested2: 'dye_067', pattern: 'split-complementary' },
      { primary: 'dye_064', suggested1: 'dye_013', suggested2: 'dye_088', pattern: 'contrast' },
      { primary: 'dye_043', suggested1: 'dye_098', suggested2: 'dye_090', pattern: 'triadic' },
      { primary: 'dye_085', suggested1: 'dye_102', suggested2: 'dye_084', pattern: 'monochromatic' },
    ];

    for (const palette of seedPalettes) {
      const clientId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO palettes (primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, client_id) VALUES (?, ?, ?, ?, ?)`
      ).bind(palette.primary, palette.suggested1, palette.suggested2, palette.pattern, clientId).run();
    }

    return Response.json({ ok: true, message: 'Migration and seed completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
