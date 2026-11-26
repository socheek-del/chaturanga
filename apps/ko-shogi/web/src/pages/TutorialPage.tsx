import { Board } from '@chaturanga/board-ui';
import { starsFor, storageKey, type LessonStep } from '@chaturanga/game-shell';
import { Button } from '@chaturanga/ui';
import type { TFunction } from 'i18next';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { Game, koShogi, squareOf, type Candidate } from '@chaturanga/ko-shogi';
import { useBoardIdentity } from '../board';
import { ActionPicker } from '../components/ActionPicker';
import { ALL_LESSONS, LESSON_UNITS, type KoShogiLesson } from '../lessons/lessons';
import { PRODUCT } from '../../product.config';

export function TutorialPage() {
  const { t } = useTranslation();
  const progress = readLessonProgress();
  return <section className="tutorial-index">
    <div className="page-heading">
      <p className="eyebrow"><span className="eyebrow-rule" />{t('tutorial.kicker')}</p>
      <h1>{t('tutorial.title')}</h1>
      <p>{t('tutorial.intro')}</p>
    </div>
    <div className="lesson-units">
      {LESSON_UNITS.map((unit, unitIndex) => <section key={unit.id} className="lesson-unit">
      <div className="unit-heading"><span>0{unitIndex + 1}</span><h2>{t(unit.title.en ?? '')}</h2></div>
        <div className="lesson-list">
          {unit.lessons.map((lesson) => <Link key={lesson.id} to={`/learn/${lesson.id}`} className="lesson-card">
            <span className="lesson-card__icon">{t(lesson.icon)}</span>
            <span className="lesson-card__copy"><strong>{t(lesson.title.en ?? '')}</strong><small>{t(lesson.summary.en ?? '')}</small></span>
            <span className="lesson-card__stars" aria-label={t('tutorial.stars', { count: progress[lesson.id] ?? 0 })}>{progress[lesson.id] ? '✦'.repeat(progress[lesson.id]!) : '—'}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>)}
        </div>
      </section>)}
    </div>
    <Link to="/atlas" className="field-key-callout"><BookOpen size={18} aria-hidden="true" /><span><strong>{t('nav.atlas')}</strong><small>{t('atlas.intro')}</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
}

function readLessonProgress(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(PRODUCT, 'lesson-stars')) ?? '{}') as unknown;
    if (!value || typeof value !== 'object') return {};
    return value as Record<string, number>;
  } catch { return {}; }
}

type Feedback = 'correct' | 'wrong' | null;

function LessonPlayer({ lesson }: { lesson: KoShogiLesson }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [complete, setComplete] = useState(false);
  const step = lesson.steps[index]!;
  const completed = index + (feedback === 'correct' || step.kind === 'info' ? 1 : 0);

  const answer = (correct: boolean) => {
    setFeedback(correct ? 'correct' : 'wrong');
    if (!correct) setMistakes((count) => count + 1);
  };
  const retry = () => { setFeedback(null); setAttempt((count) => count + 1); };
  const next = () => {
    setFeedback(null);
    if (index + 1 === lesson.steps.length) setComplete(true);
    else { setIndex((current) => current + 1); setAttempt(0); }
  };
  const finish = () => {
    const stars = starsFor(mistakes);
    const current = readLessonProgress();
    current[lesson.id] = Math.max(current[lesson.id] ?? 0, stars);
    try { localStorage.setItem(storageKey(PRODUCT, 'lesson-stars'), JSON.stringify(current)); } catch { /* Lesson completion still works without storage. */ }
    navigate('/learn');
  };

  if (complete) return <section className="lesson-complete">
    <span className="lesson-complete__seal"><CheckCircle2 size={34} aria-hidden="true" /></span>
    <p className="eyebrow"><span className="eyebrow-rule" />{t('tutorial.complete')}</p>
    <h1>{t(lesson.title.en ?? '')}</h1>
    <p>{t('tutorial.stars', { count: starsFor(mistakes) })}</p>
    <div className="earned-stars" aria-hidden="true">{'✦'.repeat(starsFor(mistakes))}</div>
    <Button size="lg" onClick={finish}>{t('tutorial.finish')}<ArrowRight size={16} aria-hidden="true" /></Button>
  </section>;

  return <section className="tutorial-player">
    <header className="tutorial-player__top">
      <Link to="/learn" className="icon-button" aria-label={t('tutorial.exit')}><ArrowLeft size={17} aria-hidden="true" /></Link>
      <div className="lesson-progress" aria-label={t('tutorial.progress')}><span style={{ width: `${(completed / lesson.steps.length) * 100}%` }} /></div>
      <span className="step-count">{t('tutorial.step', { current: index + 1, total: lesson.steps.length })}</span>
    </header>
    <div className="tutorial-player__body">
      <div className="lesson-prompt">
        <p className="eyebrow"><span className="eyebrow-rule" />{t(lesson.icon)}</p>
        <h1>{t(lesson.title.en ?? '')}</h1>
        <p>{translate(step.text, t)}</p>
      </div>
      {step.kind === 'move' && <MoveExercise key={`${index}-${attempt}`} step={step} feedback={feedback} onAnswer={answer} />}
      {step.kind === 'quiz' && <QuizExercise key={`${index}-${attempt}`} step={step} feedback={feedback} onAnswer={answer} />}
      {step.kind === 'info' && <InfoBoard step={step} />}
      <div className="tutorial-feedback" aria-live="polite">
        {feedback === 'correct' && <div className="feedback-card feedback-card--correct"><CheckCircle2 size={19} aria-hidden="true" /><span>{t('tutorial.correct')}{step.kind === 'move' && step.success ? ` ${translate(step.success, t)}` : ''}</span><Button onClick={next}>{t('tutorial.continue')}<ArrowRight size={15} aria-hidden="true" /></Button></div>}
        {feedback === 'wrong' && <div className="feedback-card feedback-card--wrong"><span>{t('tutorial.wrong')}</span><Button variant="ghost" onClick={retry}><RotateCcw size={15} aria-hidden="true" />{t('tutorial.tryAgain')}</Button></div>}
        {feedback === null && step.kind === 'info' && <Button size="lg" onClick={next}>{t('tutorial.continue')}<ArrowRight size={15} aria-hidden="true" /></Button>}
        {feedback === null && step.kind === 'quiz' && <p className="quiz-instruction">{t('tutorial.quizPrompt')}</p>}
        {feedback === null && step.kind === 'move' && <p className="quiz-instruction">{t('tutorial.movePrompt')}</p>}
      </div>
    </div>
  </section>;
}

export function LessonPlayerRoute() {
  const { id = '' } = useParams();
  const lesson = ALL_LESSONS.find((item) => item.id === id);
  return lesson ? <LessonPlayer lesson={lesson} /> : <Navigate to="/learn" replace />;
}

function translate(text: Record<string, string>, t: TFunction): string { return t(text.en ?? ''); }

function InfoBoard({ step }: { step: Extract<LessonStep, { kind: 'info' }> }) {
  const board = useBoardIdentity();
  const game = useMemo(() => new Game(step.fen ?? koShogi.startFen), [step.fen]);
  const highlighted = step.highlight?.map((name) => squareOf(name)).filter((square): square is number => square !== null) ?? [];
  return <div className="lesson-board-wrap"><Board {...board} files={19} ranks={19} pieces={game.pieces()} hintSquares={highlighted} className="tutorial-board" /></div>;
}

function MoveExercise({ step, feedback, onAnswer }: {
  step: Extract<LessonStep, { kind: 'move' }>;
  feedback: Feedback;
  onAnswer: (correct: boolean) => void;
}) {
  const board = useBoardIdentity();
  const game = useMemo(() => new Game(step.fen), [step.fen]);
  const [selected, setSelected] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<readonly Candidate[]>([]);
  const [choices, setChoices] = useState<readonly Candidate[]>([]);
  const targets = [...new Set(candidates.map(({ to }) => to))];
  const choose = (candidate: Candidate) => {
    if (feedback) return;
    if (step.solutions.includes(candidate.uci)) {
      game.playGeneratedCandidate(candidate);
      onAnswer(true);
    } else onAnswer(false);
    setChoices([]);
  };
  const click = (square: number) => {
    if (feedback) return;
    if (selected !== null && targets.includes(square)) {
      const possible = candidates.filter((candidate) => candidate.to === square);
      if (possible.length === 1) choose(possible[0]!);
      else if (possible.length > 1) setChoices(possible);
      return;
    }
    const piece = game.pieceAt(square);
    if (piece?.color === game.turn) {
      setSelected(square);
      setCandidates(game.legalCandidatesFrom(square));
      setChoices([]);
    } else { setSelected(null); setCandidates([]); setChoices([]); }
  };
  return <div className="lesson-board-wrap"><Board {...board} files={19} ranks={19} pieces={game.pieces()} selected={selected} targets={targets} onSquareClick={click} className="tutorial-board" />
    {choices.length > 0 && <ActionPicker actions={choices} onChoose={choose} onClose={() => setChoices([])} />}
  </div>;
}

function QuizExercise({ step, feedback, onAnswer }: {
  step: Extract<LessonStep, { kind: 'quiz' }>;
  feedback: Feedback;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const { t } = useTranslation();
  return <div className="quiz-choices" role="group" aria-label={translate(step.text, t)}>
    {step.choices.map((choice, index) => <button key={index} type="button" className={`quiz-choice${selected === index ? ' is-selected' : ''}`} disabled={feedback !== null} onClick={() => {
      setSelected(index);
      onAnswer(index === step.correct);
    }}>
      <span>{String.fromCharCode(65 + index)}</span><strong>{translate(choice, t)}</strong>
    </button>)}
    {step.hint && feedback === 'wrong' && <p className="quiz-hint">{translate(step.hint, t)}</p>}
  </div>;
}
