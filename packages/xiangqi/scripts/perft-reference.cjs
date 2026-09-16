/**
 * Generates perft reference counts from Fairy-Stockfish (ffish WASM) into
 * src/testing/perft-reference.json. Run: npm run perft:reference -w packages/xiangqi
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
  const board = new ffish.Board('xiangqi');
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
    { name: 'start', fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1', depth: 3 },
    // Flying-general edge cases and a cannon-screen-heavy middlegame, hand-picked to stress the rules
    // that are easy to get subtly wrong.
    { name: 'general blocked by a soldier on the shared file', fen: '4k4/9/9/9/9/4p4/9/9/9/4K4 w - - 0 1', depth: 4 },
    { name: 'cannon with two screens on a rank', fen: '4k4/9/9/9/9/2pCp4/9/9/9/4K4 w - - 0 1', depth: 4 },
    { name: 'checkmate fixture', fen: 'r2a2r2/3k4n/3aP4/9/n1b6/8p/P5p2/4R3B/3KA4/2B6 w - - 8 29', depth: 3 },
  ];
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((seed) => {
    cases.push({ name: `random seed ${seed}`, fen: randomPosition(seed, 20 + seed * 6), depth: 3 });
  });

  const positions = cases.map(({ name, fen, depth }) => {
    const board = new ffish.Board('xiangqi', fen);
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
  fs.writeFileSync(out, JSON.stringify({ generator: 'ffish@0.7.10 (Fairy-Stockfish)', positions }, null, 2) + '\n');
  console.log(`wrote ${out}`);
};
