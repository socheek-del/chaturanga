import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from '@chaturanga/fourchess';
import { parseUci, type ParsedMove } from '@chaturanga/board-ui';
import { GameBoard } from './GameBoard';
import { steps, type TutorialStep } from './tutorialSteps';

export function Tutorial({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  if (!step) {
    return (
      <main className="tutorial-page">
        <div className="tutorial-card completion-card">
          <span className="lesson-mark" aria-hidden="true">✦</span>
          <p className="eyebrow">{t('tutorial.step', { step: steps.length, count: steps.length })}</p>
          <h1>{t('tutorial.complete')}</h1>
          <button className="button button-primary" type="button" onClick={onExit}>{t('tutorial.finish')}</button>
        </div>
      </main>
    );
  }
  return (
    <main className="tutorial-page">
      <header className="tutorial-topline">
        <div>
          <p className="eyebrow">{t('tutorial.subtitle')}</p>
          <h1>{t('tutorial.title')}</h1>
        </div>
        <span className="step-count">{t('tutorial.step', { step: index + 1, count: steps.length })}</span>
      </header>
      <div className="lesson-progress" aria-label={t('tutorial.step', { step: index + 1, count: steps.length })} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((lesson, stepIndex) => <span key={lesson.id} className={stepIndex <= index ? 'is-complete' : ''} />)}
      </div>
      <TutorialStep key={step.id} step={step} next={() => setIndex((current) => current + 1)} />
    </main>
  );
}

function TutorialStep({ step, next }: { step: TutorialStep; next: () => void }) {
  const { t } = useTranslation();
  const [game] = useState(() => new Game(step.kind === 'move' ? step.fen : undefined));
  const [selected, setSelected] = useState<number | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const isCorrect = feedback === 'correct';
  const legalMoves = step.kind === 'move'
    ? game.legalUci().map((uci) => parseUci(uci, 14)).filter((move): move is Extract<ParsedMove, { kind: 'move' }> => move !== null && move.kind === 'move')
    : [];

  const play = (uci: string) => {
    if (step.kind !== 'move' || feedback === 'correct') return;
    if (uci !== step.answer) {
      setFeedback('wrong');
      return;
    }
    game.move(uci);
    setFeedback('correct');
    setSelected(null);
  };

  const onSquareClick = (square: number) => {
    if (step.kind !== 'move' || isCorrect) return;
    const selectedMoves = legalMoves.filter((move) => move.from === selected && move.to === square);
    if (selectedMoves[0]?.kind === 'move') {
      play(selectedMoves[0].uci);
      return;
    }
    setSelected(legalMoves.some((move) => move.from === square) ? square : null);
  };

  const checkAnswer = () => {
    if (step.kind === 'quiz') setFeedback(choice === step.answer ? 'correct' : 'wrong');
    else if (step.kind === 'info') next();
    else setFeedback('wrong');
  };

  return (
    <section className="lesson-card" aria-labelledby="lesson-prompt">
      <div className="lesson-copy">
        <p className="eyebrow">{t(`tutorial.steps.${step.id}`)}</p>
        {step.kind === 'info' ? (
          <p id="lesson-prompt" className="lesson-prompt">{t(`tutorial.steps.${step.id}`)}</p>
        ) : (
          <h2 id="lesson-prompt" className="lesson-prompt">{t(`tutorial.steps.${step.id}`)}</h2>
        )}
        {step.kind === 'move' && (
          <div className="lesson-board">
            <GameBoard game={game} selected={selected} legalMoves={legalMoves} canPlay={!isCorrect} onSquareClick={onSquareClick} onMove={play} />
            <p className="board-hint">{t('game.moveHint')}</p>
          </div>
        )}
        {step.kind === 'quiz' && (
          <div className="choice-list" role="group" aria-label={t('tutorial.choices')}>
            {step.choices.map((answer) => (
              <button className={`choice-button ${choice === answer ? 'is-picked' : ''}`} key={answer} type="button"
                aria-pressed={choice === answer} disabled={isCorrect}
                onClick={() => { setChoice(answer); setFeedback(null); }}>
                {t(`tutorial.answers.${answer}`)}
              </button>
            ))}
          </div>
        )}
        {feedback && <p className={`lesson-feedback ${feedback}`} role="status">{t(`tutorial.${feedback}`)}</p>}
        {(step.kind === 'info' || isCorrect) && <button type="button" className="button button-primary" onClick={next}>{t('tutorial.next')}</button>}
        {step.kind === 'quiz' && !isCorrect && <button type="button" className="button button-primary" onClick={checkAnswer} disabled={!choice}>{t('tutorial.check')}</button>}
      </div>
    </section>
  );
}
