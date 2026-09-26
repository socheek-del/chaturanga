# Stockfish — credits and licence

Game review (ch-015) analyses games on the device with Stockfish.

- **Engine:** [Stockfish](https://github.com/official-stockfish/Stockfish) 19, by the Stockfish developers
  (see the AUTHORS file of that repository).
- **Build:** [Stockfish.js](https://github.com/nmrugg/stockfish.js) by Nathan Rugg and Chess.com, npm package
  `stockfish@19.0.0`, the "lite single" flavour (`bin/stockfish-19-lite-single.js` and `.wasm`): a small NNUE
  net and a single thread, so the site needs no cross-origin isolation headers.
- **Net:** by Chris Bao (sscg13), `nn-61e7af4bb97d`, embedded in the `.wasm` file.
- **Licence:** GNU GPL version 3 (`Copying.txt`, copied from the package). This repository is GPL-3.0 too.
  The complete source is at the two repositories above.

## Rules for this folder

- The files are stored **verbatim**, renamed only so the script finds its `.wasm` next to itself
  (`stockfish.js` → `stockfish.wasm`). Do not edit them. Re-download with `npm run engine -w apps/chess/web`,
  which checks the package against the npm registry's integrity hash.
- The About page credits Stockfish and links to its source.
