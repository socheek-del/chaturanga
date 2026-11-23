import type { BoardTheme } from './themes';

const FILES = 9;
const RANKS = 10;
/** Point (column, row) of the displayed board sits at the centre of its cell (board-ui `grid="points"`). */
const at = (n: number) => n + 0.5;

/** A small diagonal cross on a cannon or soldier starting point. */
function PointMark({ col, row }: { col: number; row: number }) {
  const r = 0.1;
  const x = at(col);
  const y = at(row);
  return <path d={`M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}`} fill="none" vectorEffect="non-scaling-stroke" />;
}

/**
 * The Janggi board drawn under the pieces: an unbroken grid of points (no river), both palaces' diagonals and
 * the marks on the cannon and soldier points. Symmetric, so it is the same from either side.
 */
export function BoardLines({ theme }: { theme: BoardTheme }) {
  const rows = Array.from({ length: RANKS }, (_, r) => r);
  const cols = Array.from({ length: FILES }, (_, c) => c);
  const marks = [
    ...[1, 7].flatMap((col) => [2, 7].map((row) => ({ col, row }))),
    ...[0, 2, 4, 6, 8].flatMap((col) => [3, 6].map((row) => ({ col, row }))),
  ];

  return (
    <svg viewBox={`0 0 ${FILES} ${RANKS}`} className="h-full w-full" preserveAspectRatio="none">
      <g stroke={theme.line} strokeWidth="1.25" strokeLinecap="square">
        <rect x={at(0)} y={at(0)} width={FILES - 1} height={RANKS - 1} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {rows.map((r) => (
          <line key={`r${r}`} x1={at(0)} x2={at(FILES - 1)} y1={at(r)} y2={at(r)} vectorEffect="non-scaling-stroke" />
        ))}
        {cols.map((c) => (
          <line key={`c${c}`} x1={at(c)} x2={at(c)} y1={at(0)} y2={at(RANKS - 1)} vectorEffect="non-scaling-stroke" />
        ))}
        {[0, 7].map((top) => (
          <g key={`p${top}`}>
            <line x1={at(3)} x2={at(5)} y1={at(top)} y2={at(top + 2)} vectorEffect="non-scaling-stroke" />
            <line x1={at(5)} x2={at(3)} y1={at(top)} y2={at(top + 2)} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        <g stroke={theme.mark} strokeWidth="1.75">
          {marks.map((m) => (
            <PointMark key={`m${m.col}-${m.row}`} {...m} />
          ))}
        </g>
      </g>
    </svg>
  );
}
