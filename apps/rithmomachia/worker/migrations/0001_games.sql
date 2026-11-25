-- Finished Rithmomachia games stay in this product's isolated database.
-- Player ids are anonymous seat tokens; there are no accounts.

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  variant TEXT NOT NULL,
  white_id TEXT NOT NULL,
  black_id TEXT NOT NULL,
  start_fen TEXT NOT NULL,
  moves TEXT NOT NULL,
  time_control TEXT,
  winner TEXT,
  reason TEXT NOT NULL,
  finished_at INTEGER NOT NULL
);
CREATE INDEX games_finished ON games(finished_at DESC);
