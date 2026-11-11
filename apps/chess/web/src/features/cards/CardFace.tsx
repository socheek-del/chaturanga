import type { Piece } from '@chaturanga/chess';
import { cn } from '@chaturanga/ui';
import type { Card, CardColor } from '@chaturanga/uno';
import { Ban, Repeat2, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';
import { COLOR_PIECES } from './rules';

/**
 * Card colours: this site's own warm, saturated set — not the classic deck's exact inks — readable with a
 * white face in light and dark mode alike, because a card is a physical object and keeps its colours.
 */
export const CARD_INK: Record<CardColor, { face: string; deep: string }> = {
  red: { face: '#e4504a', deep: '#a8302c' },
  yellow: { face: '#f2b632', deep: '#b07d12' },
  green: { face: '#2e9e6a', deep: '#1c6c47' },
  blue: { face: '#3b6fd6', deep: '#26489a' },
};

const THEME = boardTheme('marble');

function Symbol({ card, className }: { card: Card; className?: string }) {
  switch (card.kind) {
    case 'number':
      return <span className={cn('font-black tabular-nums leading-none', className)}>{card.value}</span>;
    case 'skip':
      return <Ban aria-hidden strokeWidth={3} className={cn('h-[1em] w-[1em]', className)} />;
    case 'reverse':
      return <Repeat2 aria-hidden strokeWidth={3} className={cn('h-[1em] w-[1em]', className)} />;
    case 'draw2':
      return <span className={cn('font-black leading-none', className)}>+2</span>;
    case 'wild4':
      return <span className={cn('font-black leading-none', className)}>+4</span>;
    case 'wild':
      return <Sparkles aria-hidden strokeWidth={2.5} className={cn('h-[1em] w-[1em]', className)} />;
  }
}

/** Accessible name of a card, e.g. "Green 7 — moves knights". */
export function useCardName() {
  const { t } = useTranslation();
  return (card: Card, named?: CardColor) => {
    const color = card.color ?? named;
    const face = card.kind === 'number' ? String(card.value) : t(`cards.kind.${card.kind}`);
    const who = card.color ? t(`cards.moves.${card.color}`) : t('cards.moves.wild');
    return `${color ? `${t(`cards.color.${color}`)} ` : ''}${face} — ${who}`;
  };
}

export interface CardFaceProps {
  card: Card;
  /** Width in px; the height is 1.5x and the art scales with it. */
  size: number;
  /** The colour named with a wild, shown as a ring once it is on the pile. */
  named?: CardColor | null;
  className?: string;
  style?: CSSProperties;
}

const sized = (size: number): CSSProperties => ({ width: size, fontSize: size * 0.3 });

/** The front of a card. Everything inside is drawn in `em`, so the art scales with `size`. */
export function CardFace({ card, size, named, className, style }: CardFaceProps) {
  const { t } = useTranslation();
  const ink = card.color ? CARD_INK[card.color] : null;
  const background = ink
    ? `linear-gradient(160deg, ${ink.face} 0%, ${ink.face} 55%, ${ink.deep} 100%)`
    : '#1d2329';
  const pieces = card.color ? COLOR_PIECES[card.color] : null;
  return (
    <div
      className={cn('cc-card relative aspect-[2/3] select-none overflow-hidden rounded-[12%/8%] text-white', className)}
      style={{ background, ...sized(size), ...style }}
    >
      {!ink && (
        <div
          aria-hidden
          className="absolute inset-[9%] rounded-[40%] opacity-90"
          style={{
            background: `conic-gradient(${CARD_INK.red.face} 0 25%, ${CARD_INK.yellow.face} 0 50%, ${CARD_INK.green.face} 0 75%, ${CARD_INK.blue.face} 0)`,
            transform: 'rotate(18deg)',
          }}
        />
      )}
      <div aria-hidden className="absolute inset-[5%] rounded-[10%/7%] border-[0.12em] border-white/85" />
      <Symbol card={card} className="absolute left-[11%] top-[7%] text-[0.85em] drop-shadow" />
      <Symbol card={card} className="absolute bottom-[7%] right-[11%] rotate-180 text-[0.85em] drop-shadow" />
      <div
        aria-hidden
        className="absolute left-1/2 top-[45%] grid aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[14deg] place-items-center rounded-[28%] bg-white shadow-[0_0.15em_0_rgb(0_0_0/0.18)]"
        style={{ color: ink?.deep ?? '#1d2329' }}
      >
        <Symbol card={card} className="-rotate-[14deg] text-[2.2em]" />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-[16%] flex justify-center gap-[2%]">
        {pieces ? (
          pieces.map((type) => (
            <span key={type} className="grid aspect-square w-[24%] place-items-center rounded-full bg-black/25">
              <PieceSvg piece={{ color: 'w', type, promoted: false } as Piece} theme={THEME} set="traditional" className="h-[85%] w-[85%]" />
            </span>
          ))
        ) : (
          <span className="rounded-full bg-white/90 px-[8%] text-[0.42em] font-black uppercase tracking-wide text-[#1d2329]">
            {t('cards.any')}
          </span>
        )}
      </div>
      {named && !ink && (
        <span aria-hidden className="absolute inset-0 rounded-[12%/8%] ring-[0.3em] ring-inset" style={{ ['--tw-ring-color' as string]: CARD_INK[named].face }} />
      )}
    </div>
  );
}

/** The back of a card: the site's slate with a brass diamond. */
export function CardBack({ size, className, style }: { size: number; className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className={cn('cc-card relative aspect-[2/3] overflow-hidden rounded-[12%/8%] bg-[#2a3a44]', className)}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgb(255 255 255 / 0.05) 0 6%, transparent 6% 12%), linear-gradient(160deg, #36505f, #1d2a32)',
        ...sized(size),
        ...style,
      }}
    >
      <div className="absolute inset-[6%] rounded-[10%/7%] border-[0.1em] border-[#d6a44a]/70" />
      <div className="absolute left-1/2 top-1/2 grid aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center rounded-[22%] bg-[#d6a44a] shadow-inner">
        <span className="-rotate-45 text-[1.1em] font-black text-[#1d2a32]">♞</span>
      </div>
    </div>
  );
}
