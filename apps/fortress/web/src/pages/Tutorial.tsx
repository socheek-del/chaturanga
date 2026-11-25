import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game, type PieceType } from '@chaturanga/fortress';
import { Board, parseUci, PromotionPicker, type ParsedMove } from './Board';
import { tutorialSteps, type TutorialStep } from './tutorialSteps';

const reserves: readonly Exclude<PieceType, 'p' | 'q' | 'k'>[] = ['b', 'n', 'r'];

export function Tutorial({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index];
  if (!step)
    return (
      <main className="tutorial-page">
        <p className="eyebrow">{t('tutorial.completeEyebrow')}</p>
        <h1>{t('tutorial.complete')}</h1>
        <p>{t('tutorial.summary')}</p>
        <button className="button button-primary" type="button" onClick={onExit}>
          {t('tutorial.finish')}
        </button>
      </main>
    );
  return (
    <main className="tutorial-page">
      <header className="tutorial-heading">
        <div>
          <p className="eyebrow">{t('tutorial.eyebrow')}</p>
          <h1>{t('tutorial.title')}</h1>
        </div>
        <span>{t('tutorial.progress', { step: index + 1, count: tutorialSteps.length })}</span>
      </header>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(index / tutorialSteps.length) * 100}%` }} />
      </div>
      <TutorialStep key={step.id} step={step} next={() => setIndex((value) => value + 1)} />
    </main>
  );
}

function TutorialStep({ step, next }: { step: TutorialStep; next: () => void }) {
  const { t } = useTranslation();
  const [game] = useState(() => new Game(step.kind === 'quiz' ? undefined : step.fen));
  const [selected, setSelected] = useState<number | null>(null);
  const [reserve, setReserve] = useState<ParsedMove['placement'] | null>(null);
  const [promotion, setPromotion] = useState<ParsedMove[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const successful = feedback === 'correct';
  const lessonMove = step.kind === 'move' ? parseUci(step.answer) : null;
  const legal = game
    .legalUci()
    .map(parseUci)
    .filter((move): move is ParsedMove => move !== null);
  const destinations =
    selected === null
      ? reserve
        ? legal.filter((move) => move.placement === reserve)
        : []
      : legal.filter((move) => move.from === selected);

  const answerMove = (move: ParsedMove) => {
    if (step.kind !== 'move') return;
    setSelected(null);
    setReserve(null);
    setPromotion([]);
    if (move.uci !== step.answer) {
      setFeedback('wrong');
      return;
    }
    game.move(move.uci);
    setFeedback('correct');
  };
  const onSquareClick = (square: number) => {
    if (promotion.length || successful) return;
    const options = destinations.filter((move) => move.to === square);
    if (options.length > 1) setPromotion(options);
    else if (options[0]) answerMove(options[0]);
    else if (legal.some((move) => move.from === square)) {
      setSelected(square === selected ? null : square);
      setReserve(null);
    } else setSelected(null);
  };
  const action = () => {
    if (step.kind === 'quiz' && !successful) setFeedback(choice === step.answer ? 'correct' : 'wrong');
    else next();
  };

  return (
    <section className="lesson-card" data-step={step.id}>
      <div className="lesson-copy">
        <p className="lesson-index">
          {String(tutorialSteps.indexOf(step) + 1).padStart(2, '0')} /{' '}
          {String(tutorialSteps.length).padStart(2, '0')}
        </p>
        <h2>{t(`tutorial.steps.${step.id}.title`)}</h2>
        <p>{t(`tutorial.steps.${step.id}.body`)}</p>
        {step.kind === 'quiz' && (
          <div className="quiz-options" role="group" aria-label={t('tutorial.chooseAnswer')}>
            {step.choices.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={choice === option}
                disabled={successful}
                className={`button button-quiet ${choice === option ? 'is-chosen' : ''}`}
                onClick={() => {
                  setChoice(option);
                  setFeedback(null);
                }}
              >
                {t(`tutorial.choices.${option}`)}
              </button>
            ))}
          </div>
        )}
        {step.kind === 'move' && step.answer.includes('@') && (
          <div className="reserve-tray lesson-reserve" aria-label={t('game.reservePieces')}>
            {reserves.map((type) => (
              <button
                key={type}
                type="button"
                className={`reserve-token ${reserve === type ? 'is-selected' : ''}`}
                onClick={() => {
                  setReserve(type);
                  setSelected(null);
                }}
              >
                <span aria-hidden="true">{type.toUpperCase()}</span>
                {t(`pieces.${type}`)}
              </button>
            ))}
          </div>
        )}
      </div>
      {step.kind !== 'quiz' && (
        <Board
          game={game}
          selected={selected}
          destinations={destinations}
          lessonMove={successful ? null : lessonMove}
          lastMove={successful ? lessonMove : null}
          onSquareClick={step.kind === 'move' && !successful ? onSquareClick : undefined}
        >
          {promotion.length > 0 && (
            <PromotionPicker
              player={game.turn}
              moves={promotion}
              onMove={answerMove}
              onCancel={() => setPromotion([])}
            />
          )}
        </Board>
      )}
      {feedback && (
        <p className={`lesson-feedback feedback-${feedback}`} role="status">
          {t(`tutorial.${feedback}`)}
        </p>
      )}
      {(step.kind === 'info' || successful || step.kind === 'quiz') && (
        <button
          className="button button-primary"
          type="button"
          onClick={action}
          disabled={step.kind === 'quiz' && !successful && !choice}
        >
          {t(step.kind === 'quiz' && !successful ? 'tutorial.check' : 'tutorial.next')}
        </button>
      )}
    </section>
  );
}
