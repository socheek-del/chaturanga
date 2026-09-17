import { Badge, Button, type ButtonVariant, Card, ProgressBar, SegmentedControl, Switch } from '@chaturanga/ui';
import { type Piece, xiangqi } from '@chaturanga/xiangqi';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Board } from './features/board/Board';
import { PieceSvg } from './features/board/PieceSvg';
import { BOARD_THEMES } from './features/board/themes';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'danger', 'warning', 'ghost'];
const SWATCHES = ['canvas', 'surface-2', 'line', 'ink', 'muted', 'primary', 'secondary', 'danger', 'warning', 'gold'];
const TYPES = ['k', 'a', 'b', 'n', 'r', 'c', 'p'] as const;
/** A legal opening position (central cannon against screen horses), played out by the engine. */
const SAMPLE_MOVES = ['h3e3', 'h10g8', 'h1g3', 'i10h10', 'i1h1', 'b10c8'];

function samplePosition() {
  const game = xiangqi.createGame();
  for (const uci of SAMPLE_MOVES) game.move(uci);
  // Show the moves of Red's left cannon (b3 = point 19) as a selection example.
  const selected = 19;
  const targets = game.legalMoves().filter((m) => m.from === selected).map((m) => m.to);
  return { pieces: game.pieces(), last: game.lastMove(), selected, targets };
}

function Showcase({ theme }: { theme: 'light' | 'dark' }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(true);
  const [segment, setSegment] = useState<'a' | 'b'>('a');
  const { pieces, last, selected, targets } = samplePosition();

  return (
    <div data-theme={theme} data-testid={`showcase-${theme}`} className="bg-canvas text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header className="motif-mo relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-primary p-6 text-on-accent">
          <div>
            <h2 className="text-2xl font-bold">{t('brand')}</h2>
            <p className="max-w-md opacity-90">{t('design.intro')}</p>
          </div>
          <span aria-hidden className="seal h-14 w-14 shrink-0 bg-surface/95 p-1">
            <PieceSvg piece={{ color: 'w', type: 'k', promoted: false }} className="h-full w-full" />
          </span>
        </header>

        <section>
          <h3 className="mb-2 font-bold">{t('design.swatches')}</h3>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                {/* Read straight from the variable: Tailwind cannot generate a class from a runtime name. */}
                <span className="h-12 w-12 rounded-xl border border-line" data-swatch={name} style={{ background: `var(--${name})` }} />
                <span className="text-xs text-muted">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.typography')}</h3>
          <Card className="flex flex-col gap-1">
            <p className="text-2xl font-bold">{t('design.typographySample')}</p>
            <p className="text-base">{t('design.typographySample')}</p>
            <p className="text-sm text-muted">Xiangqi · 象棋 · 0123456789</p>
          </Card>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.buttons')}</h3>
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.pieces')}</h3>
          <Card className="flex flex-col gap-3">
            {(['w', 'b'] as const).map((color) => (
              <div key={color} className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="w-16 text-sm text-muted">{t(`colors.${color}`)}</span>
                {TYPES.map((type) => (
                  <span key={type} className="flex flex-col items-center">
                    {/* 40px is about a point's cell on a phone board: the characters must stay legible here. */}
                    <PieceSvg piece={{ color, type, promoted: false } as Piece} className="h-10 w-10" />
                    <span className="text-[0.65rem] text-muted">{t(`pieces.${type}`)}</span>
                  </span>
                ))}
                <span className="flex items-end gap-1 pl-2" aria-hidden>
                  {TYPES.map((type) => (
                    <PieceSvg key={type} piece={{ color, type, promoted: false } as Piece} className="h-7 w-7" />
                  ))}
                </span>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.boards')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BOARD_THEMES.map((bt) => (
              <div key={bt.id} className="flex flex-col gap-1">
                <Board
                  pieces={pieces}
                  theme={bt}
                  showCoordinates={false}
                  lastMove={last ? { from: last.from, to: last.to } : null}
                  selected={bt.id === 'maple' ? selected : null}
                  targets={bt.id === 'maple' ? targets : []}
                />
                <span className="text-xs text-muted">{t(`design.board.${bt.id}`)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.cards')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card tone="primary" className="flex items-center justify-between">
              <span className="font-bold">{t('design.sample')}</span>
              <Badge tone="primary">{t('design.sample')}</Badge>
            </Card>
            <Card tone="secondary" className="flex items-center justify-between">
              <span className="font-bold">{t('design.sample')}</span>
              <Badge tone="gold">{t('design.sample')}</Badge>
            </Card>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-bold">{t('design.controls')}</h3>
          <Card className="flex flex-col gap-3">
            <SegmentedControl
              value={segment}
              onChange={setSegment}
              label={t('design.controls')}
              options={[
                { value: 'a', label: t('colors.w') },
                { value: 'b', label: t('colors.b') },
              ]}
            />
            <div className="flex items-center gap-3">
              <Switch checked={on} onChange={setOn} label={t('design.controls')} />
              <ProgressBar value={0.62} label={t('design.sample')} tone="gold" className="flex-1" />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

/** xq-004: both colour schemes on one page, so the proposed identity can be reviewed and screenshotted. */
export function DesignPage() {
  const { t } = useTranslation();
  return (
    <main>
      <h1 className="sr-only">
        {t('brand')} — {t('design.title')}
      </h1>
      <Showcase theme="light" />
      <Showcase theme="dark" />
    </main>
  );
}
