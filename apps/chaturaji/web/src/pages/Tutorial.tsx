import { parseUci, type ParsedMove } from '@chaturanga/board-ui';
import { Game } from '@chaturanga/chaturaji';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameBoard } from './GameBoard';
import { TUTORIAL_LESSONS } from '../tutorialLessons';

export function Tutorial({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [challenge, setChallenge] = useState(() => new Game());
  const lesson = TUTORIAL_LESSONS[index];
  const moves = challenge.legalUci().map((uci) => parseUci(uci, 8)).filter((move): move is ParsedMove => move !== null);
  const boardMoves = moves.filter((move): move is Extract<ParsedMove, { kind: 'move' }> => move.kind === 'move');
  const complete = lesson?.kind === 'board' ? revision > 0 : choice === lesson?.answer;

  function advance() {
    if (!complete) return;
    setChoice(null);
    setIndex((value) => value + 1);
  }

  function play(uci: string) {
    if (lesson?.kind !== 'board' || revision > 0 || !challenge.legalUci().includes(uci)) return;
    challenge.move(uci);
    setRevision((value) => value + 1);
    setSelected(null);
  }

  function clickSquare(square: number) {
    const target = selected === null ? undefined : boardMoves.find((move) => move.from === selected && move.to === square);
    if (target) { play(target.uci); return; }
    setSelected(challenge.pieceAt(square)?.color === challenge.activeArmy ? square : null);
  }

  if (!lesson) return <main className="tutorial-page">
    <section className="lesson-complete"><span className="seal" aria-hidden="true"><i /><i /><i /><i /></span><p className="eyebrow">{t('tutorial.completeEyebrow')}</p><h1>{t('tutorial.completeTitle')}</h1><p>{t('tutorial.completeBody')}</p><div className="button-row"><button className="button button-primary" type="button" onClick={onExit}>{t('tutorial.playNow')}</button><button className="button button-outline" type="button" onClick={() => { setIndex(0); setChoice(null); setChallenge(new Game()); setRevision(0); }}>{t('tutorial.replay')}</button></div></section>
  </main>;

  const prefix = `tutorial.lessons.${lesson.id}`;
  const options = lesson.kind === 'quiz' ? [0, 1, 2, 3].map((option) => t(`${prefix}.options.${option}`)) : [];
  const correct = lesson.kind === 'quiz' && choice === lesson.answer;
  const wrong = lesson.kind === 'quiz' && choice !== null && !correct;

  return <main className="tutorial-page">
    <div className="tutorial-top"><div><p className="eyebrow"><span className="eyebrow-mark" />{t('tutorial.eyebrow')}</p><h1 className="page-title">{t('tutorial.title')}</h1></div><span className="step-count">{t('tutorial.step', { current: index + 1, total: TUTORIAL_LESSONS.length })}</span></div>
    <div className="tutorial-progress" aria-label={t('tutorial.progressLabel')}>{TUTORIAL_LESSONS.map((step, stepIndex) => <span className={stepIndex < index ? 'is-done' : ''} key={step.id} />)}</div>
    <article className="lesson-card">
      <section className="lesson-copy"><p className="eyebrow">{t(`tutorial.topic.${lesson.topic}`)}</p><h2>{t(`${prefix}.title`)}</h2><p>{t(`${prefix}.body`)}</p>
        {lesson.kind === 'quiz' ? <div className="quiz-options" role="group" aria-label={t('tutorial.answers')}>
          {options.map((option, optionIndex) => <button type="button" key={optionIndex} className={`quiz-option ${choice === optionIndex ? 'is-picked' : ''}`} aria-pressed={choice === optionIndex} onClick={() => setChoice(optionIndex)}>{option}</button>)}
        </div> : <p className="exercise-instruction">{t('tutorial.makeMove', { face: challenge.dice?.[challenge.dieIndex] ?? '' })}</p>}
        <p className={`feedback ${correct || lesson.kind === 'board' && complete ? 'is-right' : wrong ? 'is-wrong' : ''}`} aria-live="polite">
          {correct || lesson.kind === 'board' && complete ? t('tutorial.correct') : wrong ? t('tutorial.tryAgain') : lesson.kind === 'board' ? t('tutorial.exercisePrompt') : ' '}
        </p>
        <div className="lesson-actions"><button className="button button-primary" type="button" disabled={!complete} onClick={advance}>{t('tutorial.continue')}</button><button className="text-button" type="button" onClick={onExit}>{t('navigation.exitTutorial')}</button></div>
      </section>
      <div className="lesson-board">
        {lesson.kind === 'board' ? <GameBoard game={challenge} selected={selected} legalMoves={moves} canPlay={revision === 0} onSquareClick={clickSquare} onMove={play} /> : <LessonTableau topic={lesson.topic} />}
      </div>
    </article>
  </main>;
}

function LessonTableau({ topic }: { topic: string }) {
  const { t } = useTranslation();
  return <div className={`lesson-tableau topic-${topic}`} aria-label={t('tutorial.diagramLabel', { topic: t(`tutorial.topic.${topic}`) })}>
    <div className="tableau-orbit" aria-hidden="true"><span className="tableau-seat north seat-b">B</span><span className="tableau-seat east seat-r">R</span><span className="tableau-seat south seat-g">G</span><span className="tableau-seat west seat-y">Y</span><span className="tableau-center">{topic === 'dice' ? '⚄' : topic === 'scoring' ? '1·2·3·4·5' : '✦'}</span></div>
    <p>{t(`tutorial.diagram.${topic}`)}</p>
  </div>;
}
