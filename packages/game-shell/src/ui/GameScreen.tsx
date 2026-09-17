import { Board, type BoardHandle, type BoardTheme, HandTray, parseUci, useMoveInput } from '@chaturanga/board-ui';
import { type Color, type Piece, type Square, timesAt, type Variant, type VariantGame } from '@chaturanga/rules-core';
import { Button, Card, Modal } from '@chaturanga/ui';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { capturedBy, type GameResult, isUndoableResult, materialBalance } from '../result';
import { type GameSessionStore, inSetupPhase } from '../session';
import { type GameSound, soundForMove } from './format';
import { GameControls } from './GameControls';
import { useFittedBoard } from './fittedBoard';
import { useFocusMode } from './focusMode';
import { GameOverModal, resultTitleKey } from './GameOverModal';
import { MoveList } from './MoveList';
import { PlayerBar } from './PlayerBar';
import { useNow } from './useNow';

export interface GameScreenProps<G extends VariantGame> {
  variant: Variant<G>;
  useSession: GameSessionStore<G>;
  title: string;
  orientation: Color;
  names: Record<Color, string>;
  /** Extra gate on move input (e.g. only on the human's turn). */
  inputEnabled: boolean;
  rotateTopBar?: boolean;
  canUndo: boolean;
  onUndo: () => void;
  /** Which side the resign button resigns for. */
  resignColor: Color;
  hint?: { from: Square; to: Square } | null;
  /** Extra status line under the turn banner (e.g. "thinking…"). */
  status?: ReactNode;
  /** Extra action buttons (e.g. hint). */
  actions?: ReactNode;
  onRematch: () => void;
  /** Replays show the result in the banner only. */
  showResultDialog?: boolean;

  /* The product's identity. */
  theme: BoardTheme;
  showCoordinates: boolean;
  /** Draws a piece; the product owns the art. */
  renderPiece: (piece: Piece, className: string) => ReactNode;
  boardLabel: string;
  describeSquare: (square: string, piece: Piece | null) => string;
  /** Material values used for the advantage shown next to each player. */
  pieceValues: Readonly<Record<string, number>>;
  /** Plays a sound; omit for a silent product. */
  onSound?: (sound: GameSound) => void;
  /** The product's own counting card; counting rules differ per game. */
  renderCounting?: (game: G) => ReactNode;
  /** Required when the variant has hands: names a tray and a piece type in it. */
  handLabel?: (color: Color) => string;
  describeHandPiece?: (type: string, count: number) => string;
  /** Markings drawn across the board, such as the diagonals a Sittuyin Ne promotes on. */
  boardOverlay?: ReactNode;
  /** `points` puts pieces on line intersections (Xiangqi); the product then draws the lines in `boardUnderlay`. */
  boardGrid?: 'squares' | 'points';
  /** Drawn under the pieces, such as a Xiangqi board's lines, river and palaces. */
  boardUnderlay?: ReactNode;
}

export function GameScreen<G extends VariantGame>({
  variant,
  useSession,
  title,
  orientation,
  names,
  inputEnabled,
  rotateTopBar,
  canUndo,
  onUndo,
  resignColor,
  hint,
  status,
  actions,
  onRematch,
  showResultDialog = true,
  theme,
  showCoordinates,
  renderPiece,
  boardLabel,
  describeSquare,
  pieceValues,
  onSound,
  renderCounting,
  handLabel,
  describeHandPiece,
  boardOverlay,
  boardGrid,
  boardUnderlay,
}: GameScreenProps<G>) {
  const { t } = useTranslation();
  const s = useSession();
  useFocusMode('game');
  const { game, version, result, clock, viewPly, startFen } = s;
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const boardHandle = useRef<BoardHandle>(null);

  // The Start button sits low on setup screens; open the game at the top so both player bars show.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // One sound per new move (not on snapshots, undo or history browsing), and one when the game ends.
  const heard = useRef({ plies: game.moves().length, over: !!result });
  useEffect(() => {
    const plies = game.moves().length;
    const last = game.lastMove();
    if (plies > heard.current.plies && last) onSound?.(soundForMove(last, game.status()));
    else if (result && !heard.current.over) onSound?.('gameEnd');
    heard.current = { plies, over: !!result };
  }, [version, game, result, onSound]);

  const running = !!clock?.running && !result;
  const now = useNow(running ? 100 : null);
  const tick = s.tick;
  useEffect(() => {
    if (running) tick();
  }, [now, running, tick]);

  const records = game.moves();
  const livePly = records.length;
  const shownPly = viewPly ?? livePly;
  const shown = useMemo(
    () => (shownPly === livePly ? game : variant.createGame(shownPly === 0 ? startFen : records[shownPly - 1]!.fenAfter)),
    [game, shownPly, livePly, startFen, version, variant], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const placing = inSetupPhase(game);
  const aspect = variant.files / variant.ranks;
  const fit = useFittedBoard(aspect);
  const input = useMoveInput({
    game,
    version,
    canMove: inputEnabled && !result && viewPly === null,
    onMove: (m) => s.move(m),
    files: variant.files,
  });

  const top: Color = orientation === 'w' ? 'b' : 'w';
  const times = clock ? timesAt(clock, now) : null;
  const balance = materialBalance(shown, pieceValues);
  const lastRecord = shownPly > 0 ? records[shownPly - 1]! : null;
  // A record names only its destination, because a drop has no origin; the origin comes from the move string.
  const parsedLast = lastRecord ? parseUci(lastRecord.uci, variant.files) : null;
  const last = lastRecord
    ? { from: parsedLast?.kind === 'move' ? parsedLast.from : null, to: lastRecord.to }
    : null;

  const bar = (color: Color, rotated = false) => (
    <PlayerBar
      color={color}
      name={names[color]}
      captured={capturedBy(records.slice(0, shownPly), color)}
      advantage={color === 'w' ? balance : -balance}
      timeMs={times ? times[color] : null}
      active={!result && game.turn === color}
      rotated={rotated}
      renderPiece={renderPiece}
    />
  );

  const tray = (color: Color) => {
    const pieces = game.hand(color);
    if (!pieces.length || !handLabel || !describeHandPiece) return null;
    return (
      <HandTray
        color={color}
        pieces={pieces}
        theme={theme}
        renderPiece={renderPiece}
        label={handLabel(color)}
        describePiece={describeHandPiece}
        selected={game.turn === color ? input.selectedHand : null}
        canSelect={(type) => game.turn === color && input.canSelectHand(type)}
        onSelect={input.onHandSelect}
        board={boardHandle}
        onDropOnBoard={input.onDropFromHand}
      />
    );
  };

  return (
    // Below lg the board is sized so that it, the player bars, the trays, the turn banner and the product's actions
    // all fit on one screen (polish-003); history, controls and the move list follow straight after. From lg the
    // board sits beside a sidebar holding everything else.
    <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-4">
      <h1 className="sr-only">{title}</h1>
      <div ref={fit.columnRef} data-testid="game-focus" className="flex flex-col gap-2 lg:contents">
      {/* On wide screens the board may be as tall as the screen allows: its width is that height times its aspect. */}
      <div
        className="flex flex-col gap-1.5 lg:row-span-2 lg:mx-auto lg:w-full lg:max-w-[min(100%,calc((100dvh-13rem)*var(--board-aspect)),44rem)] lg:gap-2"
        style={{ '--board-aspect': aspect } as CSSProperties}
      >
        {/* Bars take the board's width so they stay aligned with it; trays keep the full width so pieces never wrap. */}
        <div className="mx-auto w-full" style={fit.style}>
          {bar(top, rotateTopBar)}
        </div>
        {variant.hasHands && tray(top)}
        <div ref={fit.boardRef} className="mx-auto w-full" style={fit.style}>
        <Board
          pieces={shown.pieces()}
          theme={theme}
          renderPiece={renderPiece}
          label={boardLabel}
          describeSquare={describeSquare}
          files={variant.files}
          ranks={variant.ranks}
          orientation={orientation}
          showCoordinates={showCoordinates}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={shown.checkedKingSquare()}
          hint={viewPly === null ? hint : null}
          animate={viewPly === null && last ? { from: last.from, to: last.to, key: `${livePly}` } : null}
          selected={input.selected}
          targets={input.targets}
          promotionTargets={input.promotionTargets}
          onSquareClick={input.onSquareClick}
          canDrag={input.canDrag}
          onDrop={input.onDrop}
          handle={boardHandle}
          overlay={boardOverlay}
          grid={boardGrid}
          underlay={boardUnderlay}
        />
        </div>
        {variant.hasHands && tray(orientation)}
        <div className="mx-auto w-full" style={fit.style}>
          {bar(orientation)}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 lg:col-start-2 lg:row-start-1 lg:gap-3">
        <Card
          role="status"
          data-testid="turn-banner"
          tone={result ? 'secondary' : game.inCheck() ? 'danger' : 'default'}
          className="py-2 text-center text-base font-extrabold lg:py-3 lg:text-lg"
        >
          {result
            ? t(resultTitleKey(result))
            : placing
              ? t('play.placing', { color: t(`colors.${game.turn}`) })
              : t('play.turn', { color: t(`colors.${game.turn}`) }) + (game.inCheck() ? ` · ${t('play.check')}` : '')}
        </Card>
        {status}
        {input.canPromoteInPlace && (
          <Button variant="warning" data-testid="promote-in-place" onClick={() => input.promoteInPlace()}>
            {t('play.promote')}
          </Button>
        )}
        {renderCounting?.(shown)}
        {actions}
      </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] lg:col-start-2 lg:row-start-2 lg:mt-3">
        <GameControls
          canBack={shownPly > 0}
          canForward={shownPly < livePly}
          onFirst={() => s.setViewPly(0)}
          onBack={() => s.setViewPly(shownPly - 1)}
          onForward={() => s.setViewPly(shownPly + 1)}
          onLast={() => s.setViewPly(null)}
          onFlip={s.flip}
          onUndo={onUndo}
          canUndo={canUndo}
          onResign={() => setConfirmResign(true)}
          canResign={!result}
        />
        {/* Right under the history buttons: entering review must not push those buttons away from the finger or
            pointer that pressed them, and on a phone it keeps the board's height steady. */}
        {viewPly !== null && (
          <Button variant="secondary" onClick={() => s.setViewPly(null)}>
            {t('play.backToLive')}
          </Button>
        )}
        <MoveList records={records} currentPly={shownPly} onSelect={(ply) => s.setViewPly(ply)} />
        <Button variant="ghost" onClick={s.exitToSetup}>
          {t('play.newGame')}
        </Button>
      </div>

      {result && showResultDialog && (
        <GameOverModal
          result={result}
          open={dismissedVersion !== version}
          onClose={() => setDismissedVersion(version)}
          onRematch={onRematch}
          onNewGame={s.exitToSetup}
        />
      )}
      <Modal
        open={confirmResign}
        onClose={() => setConfirmResign(false)}
        title={t('play.resignConfirm', { color: t(`colors.${resignColor}`) })}
      >
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmResign(false)}>
            {t('play.cancel')}
          </Button>
          <Button
            variant="danger"
            data-testid="confirm-resign"
            onClick={() => {
              setConfirmResign(false);
              s.resign(resignColor);
            }}
          >
            {t('play.resign')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Undo is allowed once a move exists, unless the game ended by time, resignation, agreement or
 * abandonment — endings that come from outside the position and that a takeback cannot reverse.
 */
export function undoAllowed(session: { game: { moves(): readonly unknown[] }; result: GameResult | null }): boolean {
  return session.game.moves().length > 0 && isUndoableResult(session.result);
}
