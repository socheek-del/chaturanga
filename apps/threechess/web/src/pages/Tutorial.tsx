import { Game } from '@chaturanga/threechess';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HexBoard, parseUci, PromotionPicker, type ParsedMove } from './HexBoard';
import { steps } from './tutorialSteps';

type Step = (typeof steps)[number];

export function Tutorial({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = steps[index];

  if (!step) return <main className="tutorial-layout">
    <h1>{t('tutorial.complete')}</h1>
    <p>{t('tutorial.summary')}</p>
    <button className="primary-button compact" onClick={onExit} type="button">{t('tutorial.finish')}</button>
  </main>;

  return <main className="tutorial-layout">
    <header className="tutorial-header">
      <h1>{t('tutorial.title')}</h1>
      <span>{t('tutorial.progress', { step: index + 1, count: steps.length })}</span>
    </header>
    <TutorialStep key={step.id} step={step} next={() => setIndex(index + 1)} />
  </main>;
}

function TutorialStep({ step, next }: { step: Step; next: () => void }) {
  const { t } = useTranslation();
  const [game] = useState(() => new Game(step.kind === 'move' ? step.fen : undefined));
  const [selected, setSelected] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<ParsedMove[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const successful = feedback === 'correct';
  const lessonMove = step.kind === 'move' ? parseUci(step.answer) : null;
  const legal = game.legalUci().map((uci) => parseUci(uci)!);
  const destinations = legal.filter((move) => move.from === selected);

  const answerMove = (move: ParsedMove) => {
    if (step.kind !== 'move') return;
    setSelected(null);
    setPromotion([]);
    if (move.uci !== step.answer) {
      setFeedback('wrong');
      return;
    }
    game.move(move.uci);
    setFeedback('correct');
  };
  const onSquareClick = (square: number) => {
    if (promotion.length) return;
    const options = destinations.filter((move) => move.to === square);
    if (options.length > 1) setPromotion(options);
    else if (options[0]) answerMove(options[0]);
    else if (legal.some((move) => move.from === square)) setSelected(square === selected ? null : square);
    else setSelected(null);
  };
  const action = () => {
    if (step.kind !== 'quiz' || successful) next();
    else setFeedback(choice === step.answer ? 'correct' : 'wrong');
  };

  return <>
    <p className="tutorial-prompt">{t(`tutorial.steps.${step.id}`)}</p>
    {step.kind !== 'quiz' && <HexBoard
      game={game} selected={selected} destinations={destinations}
      lastMove={successful ? lessonMove : undefined} lessonMove={successful ? null : lessonMove}
      onSquareClick={step.kind === 'move' && !successful ? onSquareClick : undefined}>
      {promotion.length > 0 && <PromotionPicker
        player={game.turn} moves={promotion} onMove={answerMove} onCancel={() => setPromotion([])}
      />}
    </HexBoard>}
    {step.kind === 'quiz' && <div className="tutorial-choices" role="group" aria-label={t('tutorial.choicesLabel')}>
      {step.choices.map((option) => <button
        key={option} type="button" aria-pressed={option === choice} disabled={successful}
        onClick={() => { setChoice(option); setFeedback(null); }}
        className="quiet-button">{t(`tutorial.choices.${option}`)}</button>)}
    </div>}
    {feedback && <p className={`tutorial-feedback ${feedback}`} role="status" data-result={feedback}>
      {t(`tutorial.${feedback}`)}
    </p>}
    {(step.kind === 'info' || step.kind === 'quiz' || successful) && <button
      className="primary-button compact" type="button" onClick={action}
      disabled={step.kind === 'quiz' && !successful && !choice}>
      {t(step.kind === 'quiz' && !successful ? 'tutorial.check' : 'tutorial.next')}
    </button>}
  </>;
}
