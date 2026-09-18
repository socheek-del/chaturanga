/**
 * Generates perft reference counts from Fairy-Stockfish (ffish WASM) into
 * src/testing/perft-reference.json. Run: npm run perft:reference -w packages/shogi
 *
 * Fairy-Stockfish does not implement uchifuzume, so these counts are the "Fairy-Stockfish rules" column;
 * the test compares them with perft(fen, depth, false). RULES.md explains the divergence.
 */
globalThis.fetch = undefined; // ffish's Emscripten loader must read the wasm from disk, not fetch it.
const fs = require('node:fs');
const path = require('node:path');
const ffish = require('ffish');

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function perft(board, depth) {
  if (depth === 1) return board.numberLegalMoves();
  let nodes = 0;
  for (const m of board.legalMoves().split(' ').filter(Boolean)) {
    board.push(m);
    nodes += perft(board, depth - 1);
    board.pop();
  }
  return nodes;
}

/** A position after a seeded random game from the start. */
function randomPosition(seed, plies) {
  const rand = mulberry32(seed);
  const board = new ffish.Board('shogi');
  for (let i = 0; i < plies && !board.isGameOver(true); i++) {
    const moves = board.legalMoves().split(' ').filter(Boolean);
    if (!moves.length) break;
    const captures = moves.filter((m) => board.isCapture(m));
    const pool = captures.length && rand() < 0.5 ? captures : moves;
    board.push(pool[Math.floor(rand() * pool.length)]);
  }
  const fen = board.fen();
  board.delete();
  return fen;
}

ffish.onRuntimeInitialized = () => {
  const cases = [
    { name: 'start', fen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1', depth: 4 },
    // Hand-picked positions for the rules that are easy to get subtly wrong.
    {
      name: 'a hand full of every droppable piece',
      fen: '4k4/9/9/9/9/9/9/9/4K4[GNLPSRBgnlpsrb] w - - 0 1',
      depth: 2,
    },
    {
      name: 'pawns on every file, so no pawn may be dropped',
      fen: '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/9/4K4[Pp] w - - 0 1',
      depth: 3,
    },
    { name: 'promotion zone crossings', fen: '4k4/9/1P1L3R1/9/2B6/9/9/9/4K4[] w - - 0 1', depth: 3 },
    { name: 'dragon and horse', fen: '4k4/9/9/3+R5/9/5+B3/9/9/4K4[] w - - 0 1', depth: 3 },
  ];
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((seed) => {
    cases.push({ name: `random seed ${seed}`, fen: randomPosition(seed, 20 + seed * 6), depth: 3 });
  });

  const positions = cases.map(({ name, fen, depth }) => {
    const board = new ffish.Board('shogi', fen);
    const counts = [];
    for (let d = 1; d <= depth; d++) {
      const started = Date.now();
      counts.push(perft(board, d));
      console.log(`${name} depth ${d}: ${counts[d - 1]} (${Date.now() - started} ms)`);
    }
    board.delete();
    return { name, fen, perft: counts };
  });

  const out = path.join(__dirname, '..', 'src', 'testing', 'perft-reference.json');
  fs.writeFileSync(
    out,
    JSON.stringify({ generator: 'ffish@0.7.10 (Fairy-Stockfish)', positions }, null, 2) + '\n',
  );
  console.log(`wrote ${out}`);
};
