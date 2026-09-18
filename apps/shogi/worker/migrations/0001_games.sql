-- sg-007: finished online Shogi games. There are no accounts, so a player is only the id of an
-- anonymous seat token.

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  variant TEXT NOT NULL,
  white_id TEXT NOT NULL,
  black_id TEXT NOT NULL,
  -- FEN the room started from.
  start_fen TEXT NOT NULL,
  -- Space-separated coordinate moves (h3e3 h10g8 …).
  moves TEXT NOT NULL,
  -- JSON {initialMs, incrementMs} or NULL for untimed games.
  time_control TEXT,
  -- 'w' | 'b' | NULL for a draw.
  winner TEXT,
  reason TEXT NOT NULL,
  finished_at INTEGER NOT NULL
);
CREATE INDEX games_finished ON games(finished_at DESC);
