CREATE TABLE games (
  id TEXT PRIMARY KEY,
  start_fen TEXT NOT NULL,
  moves TEXT NOT NULL,
  result_json TEXT NOT NULL
);
