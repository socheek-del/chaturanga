import { PgnError, type VariantGame } from '@chaturanga/rules-core';
import { Badge, Button, buttonClasses, Card, Modal } from '@chaturanga/ui';
import { ClipboardCopy, Download, FileUp, History, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedGame } from '../../review/history';
import type { ReviewKit } from '../../review/kit';
import { importPgn, type Outcome, outcomeOf, playerName, savedGameToPgn } from '../../review/savedGame';
import { AppLink, type ReviewLinks } from './ReviewScreen';

const OUTCOME_TONE: Record<Outcome, 'primary' | 'danger' | 'secondary' | 'neutral'> = {
  won: 'primary',
  lost: 'danger',
  draw: 'secondary',
  whiteWins: 'neutral',
  blackWins: 'neutral',
  unfinished: 'neutral',
};

export interface GamesScreenProps<G extends VariantGame> {
  kit: ReviewKit<G>;
  links: ReviewLinks;
}

/** Every game saved in this browser, newest first (ch-014, plat-017). */
export function GamesScreen<G extends VariantGame>({ kit, links }: GamesScreenProps<G>) {
  const { t } = useTranslation();
  const games = kit.history((s) => s.games);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<SavedGame | null>(null);
  const [deleting, setDeleting] = useState<SavedGame | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('games.title')}</h1>
          <p className="text-sm text-muted">{t('games.storedHere')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setImporting(true)} data-testid="import-pgn">
          <FileUp aria-hidden className="h-4 w-4" />
          {t('games.import')}
        </Button>
      </div>

      {games.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center" data-testid="games-empty">
          <History aria-hidden className="h-10 w-10 text-muted" />
          <p className="font-semibold">{t('games.empty')}</p>
          <p className="text-sm text-muted">{t('games.emptyHint')}</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="games-list">
          {games.map((game) => (
            <li key={game.id}>
              <GameRow kit={kit} links={links} game={game} onExport={() => setExporting(game)} onDelete={() => setDeleting(game)} />
            </li>
          ))}
        </ul>
      )}

      <ImportDialog kit={kit} links={links} open={importing} onClose={() => setImporting(false)} />
      <ExportDialog kit={kit} game={exporting} onClose={() => setExporting(null)} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t('games.deleteConfirm')}>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            {t('play.cancel')}
          </Button>
          <Button
            variant="danger"
            data-testid="confirm-delete"
            onClick={() => {
              if (deleting) kit.history.getState().remove(deleting.id);
              setDeleting(null);
            }}
          >
            {t('games.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function GameRow<G extends VariantGame>({
  kit,
  links,
  game,
  onExport,
  onDelete,
}: {
  kit: ReviewKit<G>;
  links: ReviewLinks;
  game: SavedGame;
  onExport: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const outcome = outcomeOf(game);
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(game.createdAt);
  const moves = Math.ceil(game.moves.length / 2);

  return (
    <Card className="flex flex-col gap-3" data-testid="game-row" data-game-id={game.id}>
      <AppLink href={links.review(game.id)} links={links} className="flex flex-col gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={OUTCOME_TONE[outcome]} data-testid="game-outcome">
            {t(`games.outcome.${outcome}`)}
          </Badge>
          <span className="text-xs font-semibold text-muted">{t(`games.mode.${game.mode}`)}</span>
        </span>
        <span className="text-lg font-bold">
          {t('games.versus', {
            white: playerName(t, game.players.w, 'w', kit.pgn.botName),
            black: playerName(t, game.players.b, 'b', kit.pgn.botName),
          })}
        </span>
        <span className="text-sm text-muted">
          {date} · {t('games.moveCount', { count: moves })}
        </span>
      </AppLink>
      <div className="flex flex-wrap gap-2">
        <AppLink href={links.review(game.id)} links={links} className={buttonClasses({ size: 'sm' })} data-testid="open-review">
          {t('games.review')}
        </AppLink>
        <Button size="sm" variant="outline" onClick={onExport} data-testid="export-pgn">
          <ClipboardCopy aria-hidden className="h-4 w-4" />
          {t('games.pgn')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label={t('games.delete')} data-testid="delete-game">
          <Trash2 aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function ImportDialog<G extends VariantGame>({
  kit,
  links,
  open,
  onClose,
}: {
  kit: ReviewKit<G>;
  links: ReviewLinks;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setText('');
    setError(null);
    onClose();
  };

  const submit = () => {
    try {
      const game = importPgn(kit.rules.variant, text, Date.now(), kit.pgn.resolve);
      kit.history.getState().upsert(game);
      close();
      links.navigate(links.review(game.id));
    } catch (err) {
      if (!(err instanceof PgnError)) throw err;
      setError(err.ply ? t('games.importIllegal', { move: err.san, number: Math.ceil(err.ply / 2) }) : t('games.importUnreadable'));
    }
  };

  return (
    <Modal open={open} onClose={close} title={t('games.importTitle')}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('games.importLabel')}
          <textarea
            data-testid="pgn-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={8}
            spellCheck={false}
            className="rounded-xl border border-line bg-surface p-3 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          />
        </label>
        {error && (
          <p role="alert" data-testid="pgn-error" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={close}>
            {t('play.cancel')}
          </Button>
          <Button onClick={submit} disabled={!text.trim()} data-testid="pgn-submit">
            {t('games.importSubmit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ExportDialog<G extends VariantGame>({ kit, game, onClose }: { kit: ReviewKit<G>; game: SavedGame | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const pgn = game ? savedGameToPgn(kit.rules.variant, game, t, kit.pgn) : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game?.id ?? 'game'}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!game}
      onClose={() => {
        setCopied(false);
        onClose();
      }}
      title={t('games.pgnTitle')}
    >
      <div className="flex flex-col gap-3">
        <textarea
          readOnly
          data-testid="pgn-output"
          value={pgn}
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
          className="rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs text-ink"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={copy} data-testid="copy-pgn">
            <ClipboardCopy aria-hidden className="h-4 w-4" />
            {copied ? t('games.copied') : t('games.copy')}
          </Button>
          <Button variant="outline" onClick={download}>
            <Download aria-hidden className="h-4 w-4" />
            {t('games.download')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
