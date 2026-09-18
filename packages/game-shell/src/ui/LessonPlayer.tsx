import { Board, type BoardHandle, type BoardTheme, HandTray, parseUci, useMoveInput } from '@chaturanga/board-ui';
import { type Color, type Piece, type Square, squareNameOf, squareOf, type Variant, type VariantGame } from '@chaturanga/rules-core';
import { Button, Card, cn, ProgressBar } from '@chaturanga/ui';
import { CheckCircle2, Star, X, XCircle } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type L10n, type Lesson, type LessonStep, starsFor } from '../lessons';
import { useFocusMode } from './focusMode';

type Feedback = null | 'correct' | 'wrong';

/** How the product's mascot (if it has one) should look at this moment. */
export type LessonMood = 'explaining' | 'thinking' | 'correct' | 'wrong' | 'complete';

export type LessonSound = 'correct' | 'wrong' | 'complete';

export interface LessonPlayerProps<G extends VariantGame, Verify = never> {
  variant: Variant<G>;
  lesson: Lesson<Verify>;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
  /** Resolves lesson text to the language the learner is reading. */
  translate: (text: L10n) => string;

  /* The product's identity. */
  theme: BoardTheme;
  showCoordinates?: boolean;
  renderPiece: (piece: Piece, className: string) => ReactNode;
  boardLabel: string;
  describeSquare: (square: string, piece: Piece | null) => string;
  /** Drawn beside the prompt; omit for a product without a mascot. */
  renderMascot?: (mood: LessonMood, className: string) => ReactNode;
  /** Markings drawn across the board, such as the diagonals a Sittuyin Ne promotes on. */
  boardOverlay?: ReactNode;
  /** `points` puts pieces on line intersections (Xiangqi); the product then draws the lines in `boardUnderlay`. */
  boardGrid?: 'squares' | 'points';
  /** Drawn under the pieces, such as a Xiangqi board's lines, river and palaces. */
  boardUnderlay?: ReactNode;
  /** Plays a sound; omit for a silent product. */
  onSound?: (sound: LessonSound) => void;

  /**
   * Required for a variant with hands (`variant.hasHands`) whose lessons teach the setup phase: a move
   * step then shows the side-to-move's tray so the learner can place a piece. Same props as the game
   * screen's trays, and named the same way.
   */
  handLabel?: (color: Color) => string;
  describeHandPiece?: (type: string, count: number) => string;
}

/**
 * Plays one lesson step by step. Every game-specific thing — the rules engine, piece art, board
 * colours, mascot and sounds — is a prop. The words it reads are listed in
 * `packages/game-shell/KEYS.md`.
 */
export function LessonPlayer<G extends VariantGame, Verify = never>(props: LessonPlayerProps<G, Verify>) {
  const { lesson, onFinish } = props;
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);
  const step = lesson.steps[index]!;
  useFocusMode('lesson');

  const answer = (correct: boolean) => {
    setFeedback(correct ? 'correct' : 'wrong');
    props.onSound?.(correct ? 'correct' : 'wrong');
    if (!correct) setMistakes((m) => m + 1);
  };
  const next = () => {
    setFeedback(null);
    if (index + 1 >= lesson.steps.length) setDone(true);
    else setIndex(index + 1);
  };
  const retry = () => {
    setFeedback(null);
    setAttempt((a) => a + 1);
  };

  if (done) return <LessonComplete {...props} stars={starsFor(mistakes)} onContinue={() => onFinish(starsFor(mistakes))} />;

  const completed = index + (feedback === 'correct' || step.kind === 'info' ? 1 : 0);

  return (
    // On a phone the lesson fills the screen: the header stays on top, the step's actions stay at the bottom,
    // and the board takes whatever height is left (polish-003). Wider screens keep the page flow.
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 max-md:h-dvh md:gap-5"
      data-testid="lesson-player"
      data-step={index}
      data-step-kind={step.kind}
    >
      <header data-testid="lesson-header" className="z-20 flex shrink-0 items-center gap-3 bg-canvas pt-1 md:sticky md:top-0 md:py-2">
        <Button variant="ghost" size="icon" aria-label={t('learn.exit')} onClick={props.onExit}>
          <X aria-hidden className="h-6 w-6 text-muted" />
        </Button>
        <ProgressBar value={completed / lesson.steps.length} label={t('learn.progress')} />
      </header>
      <StepView
        key={`${index}-${attempt}`}
        {...props}
        step={step}
        feedback={feedback}
        onAnswer={answer}
        onContinue={next}
        onRetry={retry}
      />
    </div>
  );
}

type StepProps<G extends VariantGame, Verify, S extends LessonStep<Verify>> = LessonPlayerProps<G, Verify> & {
  step: S;
  feedback: Feedback;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
  onRetry: () => void;
};

function StepView<G extends VariantGame, Verify>(props: StepProps<G, Verify, LessonStep<Verify>>) {
  switch (props.step.kind) {
    case 'info':
      return <InfoStep {...(props as StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'info' }>>)} />;
    case 'move':
      return <MoveStep {...(props as StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'move' }>>)} />;
    case 'squares':
      return <SquaresStep {...(props as StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'squares' }>>)} />;
    case 'quiz':
      return <QuizStep {...(props as StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'quiz' }>>)} />;
  }
}

/** The mascot reacts to the learner: explains, thinks along, cheers or commiserates. */
function moodFor(kind: LessonStep['kind'], feedback: Feedback): LessonMood {
  if (feedback === 'correct') return 'correct';
  if (feedback === 'wrong') return 'wrong';
  return kind === 'info' ? 'explaining' : 'thinking';
}

function Prompt({
  text,
  mood,
  translate,
  renderMascot,
}: {
  text: L10n;
  mood: LessonMood;
  translate: (text: L10n) => string;
  renderMascot?: (mood: LessonMood, className: string) => ReactNode;
}) {
  return (
    <div className="flex items-end gap-3">
      {renderMascot?.(mood, 'h-14 w-14 shrink-0 sm:h-20 sm:w-20 md:h-24 md:w-24')}
      {/* No tight leading here: a product's own line height keeps stacked scripts such as Burmese readable. */}
      <h1
        data-testid="lesson-prompt"
        className="relative flex-1 rounded-[1.25rem] border border-line bg-surface px-4 py-2.5 text-lg font-semibold shadow-card sm:text-xl md:py-3 md:text-2xl"
      >
        {translate(text)}
      </h1>
    </div>
  );
}

/**
 * One step's layout. On a phone the prompt, board and anything under it scroll inside the space between the
 * header and the actions, and the board shrinks to fit that space (a size container), so the actions are
 * never pushed off screen. Wider screens stack everything in the page flow.
 */
function StepLayout({ prompt, board, below, actions }: { prompt: ReactNode; board?: ReactNode; below?: ReactNode; actions: ReactNode }) {
  return (
    <>
      <div data-testid="lesson-body" className="flex flex-col gap-3 max-md:min-h-0 max-md:flex-1 max-md:overflow-y-auto md:gap-5">
        {prompt}
        {board ? (
          <div className="flex items-center justify-center max-md:min-h-36 max-md:flex-1 max-md:[container-type:size]">
            <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-22rem),28rem)] max-md:w-[min(100cqw,100cqh)] max-md:max-w-[28rem]">
              {board}
            </div>
          </div>
        ) : (
          <div className="max-md:flex-1" />
        )}
        {below && <div className="mx-auto flex w-full max-w-[28rem] shrink-0 flex-col gap-3">{below}</div>}
      </div>
      <div data-testid="lesson-actions" className="flex shrink-0 flex-col gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {actions}
      </div>
    </>
  );
}

/** The squares a step's solutions start from: a drop has none, so only board moves are pointed at. */
function solutionOrigins(solutions: readonly string[], files: number): Square[] {
  const squares = solutions.flatMap((uci) => {
    const parsed = parseUci(uci, files);
    return parsed?.kind === 'move' ? [parsed.from] : [];
  });
  return [...new Set(squares)];
}

/** The lesson board never animates: every step starts from its own FEN and is played once. */
function StepBoard<G extends VariantGame, Verify>({
  props,
  game,
  ...rest
}: {
  props: LessonPlayerProps<G, Verify>;
  game: G;
  targets?: Square[];
  promotionTargets?: Square[];
  hintSquares?: Square[];
  selected?: Square | null;
  lastMove?: { from?: Square | null; to: Square } | null;
  checkSquare?: Square | null;
  onSquareClick?: (square: Square) => void;
  canDrag?: (square: Square) => boolean;
  onDrop?: (from: Square, to: Square) => boolean;
  handle?: React.RefObject<BoardHandle | null>;
}) {
  return (
    <Board
      files={props.variant.files}
      ranks={props.variant.ranks}
      pieces={game.pieces()}
      theme={props.theme}
      showCoordinates={props.showCoordinates}
      renderPiece={props.renderPiece}
      label={props.boardLabel}
      describeSquare={props.describeSquare}
      overlay={props.boardOverlay}
      grid={props.boardGrid}
      underlay={props.boardUnderlay}
      {...rest}
    />
  );
}

/** The hint: one press to read it, and the board points at what it is about (plat-014). */
function HintPanel({
  hint,
  shown,
  onShow,
  translate,
}: {
  hint: L10n;
  shown: boolean;
  onShow: () => void;
  translate: (text: L10n) => string;
}) {
  const { t } = useTranslation();
  if (shown) {
    return (
      <Card tone="secondary" role="status" data-testid="lesson-hint" className="py-2 text-center font-medium">
        {translate(hint)}
      </Card>
    );
  }
  return (
    <Button block variant="ghost" data-testid="show-hint" onClick={onShow}>
      {t('learn.hint')}
    </Button>
  );
}

function Footer({
  feedback,
  onCheck,
  canCheck = true,
  onContinue,
  onRetry,
  hint,
  onHint,
  hintShown = false,
  success,
  translate,
}: {
  feedback: Feedback;
  onCheck?: () => void;
  canCheck?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  hint?: L10n;
  /** Given when the step can point at the answer; the button only shows then (plat-014). */
  onHint?: () => void;
  hintShown?: boolean;
  success?: L10n;
  translate: (text: L10n) => string;
}) {
  const { t } = useTranslation();
  if (feedback === 'correct') {
    return (
      <Card tone="secondary" role="status" data-testid="feedback" data-result="correct" className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xl font-bold text-secondary-shadow dark:text-secondary">
          <CheckCircle2 aria-hidden className="h-6 w-6" />
          {t('learn.correct')}
        </p>
        {success && <p className="font-medium">{translate(success)}</p>}
        <Button block size="lg" variant="secondary" onClick={onContinue}>
          {t('learn.continue')}
        </Button>
      </Card>
    );
  }
  if (feedback === 'wrong') {
    return (
      <Card tone="danger" role="status" data-testid="feedback" data-result="wrong" className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xl font-bold text-danger">
          <XCircle aria-hidden className="h-6 w-6" />
          {t('learn.wrong')}
        </p>
        {hint && <p className="font-medium">{translate(hint)}</p>}
        <Button block size="lg" variant="danger" onClick={onRetry}>
          {t('learn.tryAgain')}
        </Button>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {/* Nobody should be stuck on a lesson: the hint is one press away, and costs nothing. */}
      {hint && onHint && (hintShown || feedback === null) && (
        <HintPanel hint={hint} shown={hintShown} onShow={onHint} translate={translate} />
      )}
      {onCheck ? (
        <Button block size="lg" onClick={onCheck} disabled={!canCheck}>
          {t('learn.check')}
        </Button>
      ) : (
        <Button block size="lg" onClick={onContinue}>
          {t('learn.continue')}
        </Button>
      )}
    </div>
  );
}

function InfoStep<G extends VariantGame, Verify>(props: StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'info' }>>) {
  const { step, feedback } = props;
  const [game] = useState(() => (step.fen ? props.variant.createGame(step.fen) : null));
  return (
    <StepLayout
      prompt={<Prompt text={step.text} mood={moodFor(step.kind, feedback)} translate={props.translate} renderMascot={props.renderMascot} />}
      board={
        game && (
          <StepBoard
            props={props}
            game={game}
            targets={(step.highlight ?? []).map((s) => squareOf(s, props.variant.files) ?? -1)}
          />
        )
      }
      actions={<Footer feedback={feedback} onContinue={props.onContinue} onRetry={props.onRetry} translate={props.translate} />}
    />
  );
}

/** Compares two engine move strings by square only, ignoring a promotion-letter suffix. */
function sameSquares(a: string, b: string, files: number): boolean {
  const pa = parseUci(a, files);
  const pb = parseUci(b, files);
  if (!pa || !pb || pa.kind !== pb.kind) return false;
  if (pa.kind === 'drop') return pb.kind === 'drop' && pa.type === pb.type && pa.to === pb.to;
  return pb.kind === 'move' && pa.from === pb.from && pa.to === pb.to;
}

function MoveStep<G extends VariantGame, Verify>(props: StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'move' }>>) {
  const { step, feedback, onAnswer } = props;
  const { t } = useTranslation();
  const [game] = useState(() => props.variant.createGame(step.fen));
  const [version, setVersion] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const boardHandle = useRef<BoardHandle | null>(null);
  const input = useMoveInput({
    game,
    version,
    canMove: feedback === null,
    files: props.variant.files,
    onMove: (move) => {
      const record = game.move(move);
      setVersion((v) => v + 1);
      // Compare the squares only: a lesson accepts the move, whichever promotion letter it carries.
      onAnswer(step.solutions.some((s) => sameSquares(s, record.uci, props.variant.files)));
    },
  });
  const last = game.lastMove();
  // A record names only its destination, because a drop has no origin; the origin comes from the move string.
  const parsedLast = last ? parseUci(last.uci, props.variant.files) : null;
  // Only the side to move has a tray: a lesson is one move long, so the other side never places.
  const turn: Color = game.turn;
  const inHand = props.variant.hasHands ? game.hand(turn) : [];
  const showTray = inHand.length > 0 && !!props.handLabel && !!props.describeHandPiece;
  return (
    <StepLayout
      prompt={<Prompt text={step.text} mood={moodFor(step.kind, feedback)} translate={props.translate} renderMascot={props.renderMascot} />}
      board={
        <StepBoard
          props={props}
          game={game}
          lastMove={last ? { from: parsedLast?.kind === 'move' ? parsedLast.from : null, to: last.to } : null}
          checkSquare={game.checkedKingSquare()}
          selected={input.selected}
          targets={input.targets}
          promotionTargets={input.promotionTargets}
          // The hint points at the piece to play, not at where it goes: it nudges without answering.
          hintSquares={hintShown ? solutionOrigins(step.solutions, props.variant.files) : undefined}
          onSquareClick={input.onSquareClick}
          canDrag={input.canDrag}
          onDrop={input.onDrop}
          handle={boardHandle}
        />
      }
      below={
        showTray && (
          <HandTray
            color={turn}
            pieces={inHand}
            theme={props.theme}
            renderPiece={props.renderPiece}
            label={props.handLabel!(turn)}
            describePiece={props.describeHandPiece!}
            selected={input.selectedHand}
            canSelect={input.canSelectHand}
            onSelect={input.onHandSelect}
            board={boardHandle}
            onDropOnBoard={input.onDropFromHand}
          />
        )
      }
      actions={
        <>
          {input.canPromoteInPlace && feedback === null && (
            <Button block variant="warning" data-testid="promote-in-place" onClick={() => input.promoteInPlace()}>
              {t('play.promote')}
            </Button>
          )}
          {feedback !== null && (
            <Footer
              feedback={feedback}
              onContinue={props.onContinue}
              onRetry={props.onRetry}
              hint={step.hint}
              success={step.success}
              translate={props.translate}
            />
          )}
          {feedback === null && step.hint && (
            <HintPanel hint={step.hint} shown={hintShown} onShow={() => setHintShown(true)} translate={props.translate} />
          )}
        </>
      }
    />
  );
}

function SquaresStep<G extends VariantGame, Verify>(props: StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'squares' }>>) {
  const { step, feedback, onAnswer } = props;
  const [game] = useState(() => props.variant.createGame(step.fen));
  const [picked, setPicked] = useState<string[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const toggle = (square: Square) => {
    if (feedback !== null) return;
    const name = squareNameOf(square, props.variant.files);
    setPicked((p) => (p.includes(name) ? p.filter((s) => s !== name) : [...p, name]));
  };
  return (
    <StepLayout
      prompt={<Prompt text={step.text} mood={moodFor(step.kind, feedback)} translate={props.translate} renderMascot={props.renderMascot} />}
      board={
        <StepBoard
          props={props}
          game={game}
          targets={picked.map((s) => squareOf(s, props.variant.files) ?? -1)}
          hintSquares={hintShown ? step.answer.map((s) => squareOf(s, props.variant.files) ?? -1) : undefined}
          onSquareClick={toggle}
        />
      }
      actions={
        <Footer
          feedback={feedback}
          onCheck={() => onAnswer([...picked].sort().join() === [...step.answer].sort().join())}
          canCheck={picked.length > 0}
          onContinue={props.onContinue}
          onRetry={props.onRetry}
          hint={step.hint}
          onHint={() => setHintShown(true)}
          hintShown={hintShown}
          translate={props.translate}
        />
      }
    />
  );
}

function QuizStep<G extends VariantGame, Verify>(props: StepProps<G, Verify, Extract<LessonStep<Verify>, { kind: 'quiz' }>>) {
  const { step, feedback, onAnswer, translate } = props;
  const [game] = useState(() => (step.fen ? props.variant.createGame(step.fen) : null));
  const [choice, setChoice] = useState<number | null>(null);
  const [hintShown, setHintShown] = useState(false);
  return (
    <StepLayout
      prompt={<Prompt text={step.text} mood={moodFor(step.kind, feedback)} translate={translate} renderMascot={props.renderMascot} />}
      board={game && <StepBoard props={props} game={game} />}
      below={
        <div role="radiogroup" aria-label={translate(step.text)} className="flex flex-col gap-2 md:gap-3">
          {step.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={choice === i}
              data-choice={i}
              disabled={feedback !== null}
              onClick={() => setChoice(i)}
              className={cn(
                'rounded-2xl border px-4 py-2.5 text-left text-base font-medium shadow-card transition-colors md:py-3 md:text-lg',
                choice === i ? 'border-primary bg-primary-soft text-primary ring-1 ring-primary' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              {translate(c)}
            </button>
          ))}
        </div>
      }
      actions={
        <Footer
          feedback={feedback}
          onCheck={() => onAnswer(choice === step.correct)}
          canCheck={choice !== null}
          onContinue={props.onContinue}
          onRetry={props.onRetry}
          hint={step.hint}
          onHint={() => setHintShown(true)}
          hintShown={hintShown}
          translate={translate}
        />
      }
    />
  );
}

function LessonComplete<G extends VariantGame, Verify>({
  lesson,
  stars,
  onContinue,
  translate,
  renderMascot,
  onSound,
}: LessonPlayerProps<G, Verify> & { stars: 1 | 2 | 3; onContinue: () => void }) {
  const { t } = useTranslation();
  useEffect(() => onSound?.('complete'), [onSound]);
  return (
    <div data-testid="lesson-complete" data-stars={stars} className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-8 text-center">
      {renderMascot?.('complete', 'h-36 w-36')}
      <p className="text-lg font-bold text-muted">{translate(lesson.title)}</p>
      <h1 className="text-4xl font-extrabold text-gold">{t('learn.complete')}</h1>
      <div className="flex gap-2" role="img" aria-label={t('learn.stars', { count: stars })}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={cn('h-16 w-16 transition-transform', i <= stars ? 'scale-100 fill-gold text-gold' : 'scale-90 text-line')}
          />
        ))}
      </div>
      <Card tone="warning" className="px-6 text-2xl font-extrabold text-gold">
        +{lesson.xp} XP
      </Card>
      <Button size="lg" block onClick={onContinue}>
        {t('learn.continue')}
      </Button>
    </div>
  );
}
