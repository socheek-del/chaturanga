# Fairy-Stockfish — credits and licence

Makruk game review (review-002) analyses games on the device with Fairy-Stockfish, the engine the Makruk
rules in `packages/makruk` are verified against.

- **Engine:** [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) by Fabian Fichter and
  the Stockfish developers (`AUTHORS`), a Stockfish derivative that plays chess variants, Makruk among them.
- **Build:** [fairy-stockfish.wasm](https://github.com/fairy-stockfish/fairy-stockfish.wasm), npm package
  `fairy-stockfish-nnue.wasm@1.1.12` (`stockfish.js`, `stockfish.wasm`, `stockfish.worker.js`). It searches
  in threads, so the site is served cross-origin isolated (`public/_headers` and `vite.config.ts`).
- **Licence:** GNU GPL version 3 (`Copying.txt`, copied from the package). This repository is GPL-3.0 too.
  The complete source is at the two repositories above.

## Rules for this folder

- The files are stored **verbatim**, under the names the module script expects. Do not edit them.
  Re-download with `npm run engine -w apps/makruk/web`, which checks the package against the npm registry's
  integrity hash.
- The About page credits Fairy-Stockfish and links to its source.
