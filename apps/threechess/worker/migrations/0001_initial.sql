CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  position TEXT NOT NULL,
  result TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
