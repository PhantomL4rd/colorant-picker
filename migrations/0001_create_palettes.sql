-- パレットテーブル
CREATE TABLE palettes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  primary_dye_id TEXT NOT NULL,
  suggested_dye_id_1 TEXT NOT NULL,
  suggested_dye_id_2 TEXT NOT NULL,
  pattern TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 重複防止インデックス（同一クライアントからの同一パレット投稿を防ぐ）
CREATE UNIQUE INDEX idx_palettes_unique
ON palettes(primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, client_id);

-- 最新取得用インデックス
CREATE INDEX idx_palettes_created_at ON palettes(created_at DESC);
