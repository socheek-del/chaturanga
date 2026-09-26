import type { Color } from '@chaturanga/chess';
import { cn } from '@chaturanga/ui';
import { BookOpen, Check, type LucideIcon, Star, ThumbsUp, X } from 'lucide-react';
import type { CSSProperties, PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Label } from './analysis';
import { formatScore, graphPoints, plyAt, squareCenter, whiteShare } from './geometry';
import type { Score } from './uci';

/** Each label's colour token, and either a chess annotation glyph or an icon (ch-016). */
export const LABEL_MARK: Record<Label, { color: string; glyph?: string; icon?: LucideIcon }> = {
  brilliant: { color: 'var(--grade-brilliant)', glyph: '!!' },
  great: { color: 'var(--grade-great)', glyph: '!' },
  best: { color: 'var(--grade-best)', icon: Star },
  excellent: { color: 'var(--grade-excellent)', icon: ThumbsUp },
  good: { color: 'var(--grade-good)', icon: Check },
  book: { color: 'var(--grade-book)', icon: BookOpen },
  inaccuracy: { color: 'var(--grade-inaccuracy)', glyph: '?!' },
  mistake: { color: 'var(--grade-mistake)', glyph: '?' },
  miss: { color: 'var(--grade-miss)', icon: X },
  blunder: { color: 'var(--grade-blunder)', glyph: '??' },
};

/** A round mark in the label's colour; named for screen readers. */
export function LabelBadge({ label, className, decorative = false }: { label: Label; className?: string; decorative?: boolean }) {
  const { t } = useTranslation();
  const mark = LABEL_MARK[label];
  const Icon = mark.icon;
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : t(`review.labelName.${label}`)}
      data-label={label}
      className={cn('inline-grid h-6 w-6 shrink-0 place-items-center rounded-full font-extrabold leading-none text-white', className)}
      style={{ background: mark.color }}
    >
      {Icon ? <Icon aria-hidden className="h-[60%] w-[60%]" strokeWidth={3} /> : <span className="text-[0.7em] tracking-tight">{mark.glyph}</span>}
    </span>
  );
}

/** The engine's preferred move as an arrow, and the played move's label on its square: drawn over the board. */
export function BoardMarks({
  orientation,
  arrow,
  badge,
}: {
  orientation: Color;
  arrow: { from: number; to: number } | null;
  badge: { square: number; label: Label } | null;
}) {
  const a = arrow ? { from: squareCenter(arrow.from, orientation), to: squareCenter(arrow.to, orientation) } : null;
  const b = badge ? squareCenter(badge.square, orientation) : null;
  let line = null;
  if (a) {
    const dx = a.to.x - a.from.x;
    const dy = a.to.y - a.from.y;
    const length = Math.hypot(dx, dy);
    // Stop short of the centre so the head sits on the square, not past it.
    const end = { x: a.to.x - (dx / length) * 0.32, y: a.to.y - (dy / length) * 0.32 };
    line = { ...a, end };
  }
  return (
    <svg viewBox="0 0 8 8" className="h-full w-full" data-testid="board-marks">
      <defs>
        <marker id="review-arrow-head" viewBox="0 0 4 4" refX="1.2" refY="2" markerWidth="3" markerHeight="3" orient="auto">
          <path d="M0,0 L4,2 L0,4 z" fill="var(--grade-best)" />
        </marker>
      </defs>
      {line && (
        <line
          data-testid="best-arrow"
          data-from={arrow!.from}
          data-to={arrow!.to}
          x1={line.from.x}
          y1={line.from.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke="var(--grade-best)"
          strokeWidth={0.17}
          strokeLinecap="round"
          opacity={0.85}
          markerEnd="url(#review-arrow-head)"
        />
      )}
      {b && badge && (
        <g data-testid="square-badge" data-label={badge.label} transform={`translate(${b.x + 0.32} ${b.y - 0.32})`}>
          <circle r={0.22} fill={LABEL_MARK[badge.label].color} stroke="var(--surface)" strokeWidth={0.04} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={0.22}
            fontWeight={800}
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            {LABEL_MARK[badge.label].glyph ?? GLYPH_FALLBACK[badge.label]}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Text stand-ins for the icon labels inside the SVG badge. */
const GLYPH_FALLBACK: Partial<Record<Label, string>> = { best: '★', excellent: '✓', good: '✓', book: '≡', miss: '✕' };

/** A vertical bar split between White and Black by White's win percentage, with the score on it. */
export function EvalBar({ whiteWin, score, orientation, className }: { whiteWin: number; score: Score; orientation: Color; className?: string }) {
  const { t } = useTranslation();
  const share = whiteShare(whiteWin);
  const text = formatScore(score);
  const whiteLeads = whiteWin >= 50;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(whiteWin)}
      aria-label={t('review.evalBar', { score: text })}
      data-testid="eval-bar"
      data-white={share.toFixed(1)}
      className={cn('relative flex w-6 shrink-0 overflow-hidden rounded-md border border-line', orientation === 'w' ? 'flex-col' : 'flex-col-reverse', className)}
      style={{ background: 'var(--eval-black)' }}
    >
      <div className="flex-1" />
      <div className="transition-[height] duration-300" style={{ height: `${share}%`, background: 'var(--eval-white)' }} />
      <span
        className={cn(
          'absolute inset-x-0 text-center text-[0.5rem] leading-none font-bold tracking-tighter',
          whiteLeads === (orientation === 'w') ? 'bottom-1' : 'top-1',
        )}
        style={{ color: whiteLeads ? 'var(--eval-black)' : 'var(--eval-white)' }}
      >
        {text}
      </span>
    </div>
  );
}

const GRAPH_W = 300;
const GRAPH_H = 64;

/** White's chances over the game; the worst moves are marked, and a tap jumps to that point. */
export function EvalGraph({
  whiteWins,
  labels,
  current,
  onSelect,
}: {
  whiteWins: readonly number[];
  labels: readonly Label[];
  current: number;
  onSelect: (ply: number) => void;
}) {
  const { t } = useTranslation();
  const points = graphPoints(whiteWins, GRAPH_W, GRAPH_H);
  const plies = whiteWins.length - 1;
  const path = `M0,${GRAPH_H} ${points.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} L${GRAPH_W},${GRAPH_H} Z`;
  const cursor = points[current];

  const select = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSelect(plyAt(((event.clientX - rect.left) / rect.width) * GRAPH_W, GRAPH_W, plies));
  };

  return (
    <svg
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={t('review.graph')}
      data-testid="eval-graph"
      className="block h-16 w-full cursor-pointer touch-none overflow-hidden rounded-xl border border-line"
      style={{ background: 'var(--eval-black)' } as CSSProperties}
      onPointerDown={select}
    >
      <path d={path} fill="var(--eval-white)" />
      <line x1={0} x2={GRAPH_W} y1={GRAPH_H / 2} y2={GRAPH_H / 2} stroke="var(--subtle)" strokeWidth={0.6} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      {labels.map((label, i) =>
        label === 'blunder' || label === 'mistake' || label === 'miss' || label === 'brilliant' || label === 'great' ? (
          <circle key={i} cx={points[i + 1]!.x} cy={points[i + 1]!.y} r={2.4} fill={LABEL_MARK[label].color} vectorEffect="non-scaling-stroke" />
        ) : null,
      )}
      {cursor && <line data-testid="graph-cursor" data-ply={current} x1={cursor.x} x2={cursor.x} y1={0} y2={GRAPH_H} stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
