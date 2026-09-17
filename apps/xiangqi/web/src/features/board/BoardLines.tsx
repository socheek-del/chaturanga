import { RIVER_GLYPHS } from './glyphs';
import type { BoardTheme } from './themes';

const FILES = 9;
const RANKS = 10;
/** Point (column, row) of the displayed board sits at the centre of its cell (board-ui `grid="points"`). */
const at = (n: number) => n + 0.5;

/** Corner brackets around a cannon or soldier starting point; halves at the board edge. */
function PointMark({ col, row }: { col: number; row: number }) {
  const g = 0.08;
  const l = 0.18;
  const x = at(col);
  const y = at(row);
  const corners = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].filter(([dx]) => (dx! < 0 ? col > 0 : col < FILES - 1));
  return (
    <>
      {corners.map(([dx, dy]) => (
        <path
          key={`${dx}${dy}`}
          d={`M${x + dx! * g} ${y + dy! * (g + l)} V${y + dy! * g} H${x + dx! * (g + l)}`}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
}

/**
 * The Xiangqi board drawn under the pieces: the grid of points, the river with 楚河 漢界, both palaces'
 * diagonals and the marks on the cannon and soldier points. Symmetric, so it is the same from either side.
 */
export function BoardLines({ theme }: { theme: BoardTheme }) {
  const rows = Array.from({ length: RANKS }, (_, r) => r);
  const cols = Array.from({ length: FILES }, (_, c) => c);
  const marks = [
    ...[1, 7].flatMap((col) => [2, 7].map((row) => ({ col, row }))),
    ...[0, 2, 4, 6, 8].flatMap((col) => [3, 6].map((row) => ({ col, row }))),
  ];
  const river = Object.values(RIVER_GLYPHS);
  // River glyphs are 100-unit boxes; scale one to about 60% of a cell and place two per bank.
  const glyphScale = 0.0085;
  const glyphAt = [1.5, 2.5, 5.5, 6.5];

  return (
    <svg viewBox={`0 0 ${FILES} ${RANKS}`} className="h-full w-full" preserveAspectRatio="none">
      <g stroke={theme.line} strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeLinecap="square">
        <rect x={at(0)} y={at(0)} width={FILES - 1} height={RANKS - 1} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {rows.map((r) => (
          <line key={`r${r}`} x1={at(0)} x2={at(FILES - 1)} y1={at(r)} y2={at(r)} vectorEffect="non-scaling-stroke" />
        ))}
        {cols.slice(1, -1).map((c) => (
          <g key={`c${c}`}>
            <line x1={at(c)} x2={at(c)} y1={at(0)} y2={at(4)} vectorEffect="non-scaling-stroke" />
            <line x1={at(c)} x2={at(c)} y1={at(5)} y2={at(9)} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {[0, 7].map((top) => (
          <g key={`p${top}`}>
            <line x1={at(3)} x2={at(5)} y1={at(top)} y2={at(top + 2)} vectorEffect="non-scaling-stroke" />
            <line x1={at(5)} x2={at(3)} y1={at(top)} y2={at(top + 2)} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        <g stroke={theme.river}>
          {marks.map((m) => (
            <PointMark key={`m${m.col}-${m.row}`} {...m} />
          ))}
        </g>
      </g>
      <g fill={theme.river} opacity="0.85">
        {river.map((d, i) => (
          <path
            key={i}
            d={d}
            transform={`translate(${at(glyphAt[i]!) - 50 * glyphScale} ${5 - 50 * glyphScale}) scale(${glyphScale})`}
          />
        ))}
      </g>
    </svg>
  );
}
