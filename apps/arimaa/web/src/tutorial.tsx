import { Button, Card } from '@chaturanga/ui';
import { Game, arimaa, type PieceType } from '@chaturanga/arimaa';
import { squareName, type Color } from '@chaturanga/rules-core';
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router';
import { ArimaaBoard, PieceMark } from './board';
import { TurnEditor } from './components/TurnEditor';

type LessonKind = 'setup' | 'move' | 'quiz';
type QuizId = 'elimination' | 'immobilization' | 'repetition' | 'priority' | 'noPass';
interface Placement { type: PieceType; color: Color; square: string }
interface Lesson {
  id: string;
  kind: LessonKind;
  fen: string;
  before?: string[];
  solutions?: string[];
  quiz?: QuizId;
  choices?: string[];
}

function positionFen(placements: readonly Placement[], turn: Color = 'w'): string {
  const board: Array<Array<string | null>> = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const { type, color, square } of placements) {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]) - 1;
    board[rank]![file] = color === 'w' ? type.toUpperCase() : type;
  }
  const rows = Array.from({ length: 8 }, (_, rowIndex) => {
    const row = board[7 - rowIndex]!;
    let empty = 0;
    let result = '';
    for (const value of row) {
      if (value === null) empty++;
      else {
        if (empty) result += String(empty);
        result += value;
        empty = 0;
      }
    }
    if (empty) result += String(empty);
    return result;
  });
  return `${rows.join('/')} ${turn} - - 0 1`;
}

const fens = {
  simple: positionFen([
    { type: 'r', color: 'w', square: 'a2' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  rabbit: positionFen([
    { type: 'r', color: 'w', square: 'd4' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  freeze: positionFen([
    { type: 'r', color: 'w', square: 'd2' },
    { type: 'c', color: 'w', square: 'b2' },
    { type: 'e', color: 'b', square: 'd3' },
    { type: 'r', color: 'w', square: 'a1' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  pushPull: positionFen([
    { type: 'e', color: 'w', square: 'c4' },
    { type: 'r', color: 'w', square: 'a1' },
    { type: 'r', color: 'b', square: 'd4' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  trap: positionFen([
    { type: 'c', color: 'w', square: 'b3' },
    { type: 'r', color: 'w', square: 'c3' },
    { type: 'r', color: 'w', square: 'a1' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  supportGoal: positionFen([
    { type: 'r', color: 'w', square: 'a7' },
    { type: 'c', color: 'w', square: 'b3' },
    { type: 'r', color: 'w', square: 'c3' },
    { type: 'r', color: 'b', square: 'h7' },
  ]),
  goal: positionFen([
    { type: 'r', color: 'w', square: 'b7' },
    { type: 'r', color: 'b', square: 'h7' },
  ]),
  elimination: positionFen([
    { type: 'r', color: 'w', square: 'a1' },
    { type: 'e', color: 'b', square: 'c4' },
  ], 'b'),
  immobilization: positionFen([
    { type: 'r', color: 'w', square: 'd4' },
    { type: 'e', color: 'b', square: 'd5' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  repetition: positionFen([
    { type: 'r', color: 'w', square: 'a1' },
    { type: 'e', color: 'w', square: 'c4' },
    { type: 'e', color: 'b', square: 'f4' },
    { type: 'r', color: 'b', square: 'h8' },
  ]),
  priority: positionFen([
    { type: 'r', color: 'w', square: 'a8' },
    { type: 'r', color: 'b', square: 'h1' },
  ]),
};

export const LESSONS: readonly Lesson[] = [
  { id: 'setup', kind: 'setup', fen: arimaa.startFen },
  { id: 'orthogonal', kind: 'move', fen: positionFen([{ type: 'd', color: 'w', square: 'c4' }, { type: 'r', color: 'w', square: 'a1' }, { type: 'r', color: 'b', square: 'h8' }]), solutions: ['c4d4'] },
  { id: 'steps', kind: 'move', fen: fens.simple, solutions: ['a2a3a3a4a4a5a5a6'] },
  { id: 'rabbit', kind: 'move', fen: fens.rabbit, solutions: ['d4d5'] },
  { id: 'freeze', kind: 'move', fen: fens.freeze, solutions: ['b2c2'] },
  { id: 'push', kind: 'move', fen: fens.pushPull, solutions: ['d4d5c4d4'] },
  { id: 'pull', kind: 'move', fen: fens.pushPull, solutions: ['c4c5d4c4'] },
  { id: 'trap', kind: 'move', fen: fens.trap, solutions: ['b3b2'] },
  { id: 'support', kind: 'move', fen: fens.supportGoal, solutions: ['a7a8'] },
  { id: 'goal', kind: 'move', fen: fens.goal, solutions: ['b7b8'] },
  { id: 'elimination', kind: 'quiz', fen: fens.elimination, quiz: 'elimination', choices: ['goldWin', 'silverWin'] },
  { id: 'immobilization', kind: 'quiz', fen: fens.immobilization, quiz: 'immobilization', choices: ['goldWin', 'silverWin'] },
  { id: 'repetition', kind: 'quiz', fen: fens.repetition, before: ['c4c5', 'f4f5', 'c5c4', 'f5f4', 'c4c5', 'f4f5', 'c5c4'], quiz: 'repetition', choices: ['repeatAllowed', 'repeatBlocked'] },
  { id: 'noPass', kind: 'quiz', fen: fens.pushPull, quiz: 'noPass', choices: ['passAllowed', 'passBlocked'] },
  { id: 'priority', kind: 'quiz', fen: fens.priority, quiz: 'priority', choices: ['goldGoal', 'silverGoal'] },
];

function makeLessonGame(lesson: Lesson): Game {
  const game = new Game(lesson.fen);
  for (const move of lesson.before ?? []) game.move(move);
  return game;
}

function canApply(game: Game, move: string): boolean {
  try {
    game.move(move);
    game.undo();
    return true;
  } catch {
    return false;
  }
}

function quizAnswer(lesson: Lesson, game: Game): string {
  const status = game.status();
  if (lesson.quiz === 'repetition') return canApply(game, 'f5f4') ? 'repeatAllowed' : 'repeatBlocked';
  if (lesson.quiz === 'noPass') return canApply(game, 'c4c5c5c4') ? 'passAllowed' : 'passBlocked';
  if (lesson.quiz === 'priority') return status.kind !== 'ongoing' && 'winner' in status && status.winner === 'b' ? 'silverGoal' : 'goldGoal';
  if (status.kind !== 'ongoing' && 'winner' in status && status.winner === 'b') return 'silverWin';
  return 'goldWin';
}

const PROGRESS_KEY = 'arimaa.lessonProgress.v1';

function readProgress(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]') as unknown;
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  } catch {
    return [];
  }
}

function saveLesson(id: string): void {
  const completed = new Set(readProgress());
  completed.add(id);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completed]));
}

export function LearnIndex() {
  const { t } = useTranslation();
  const completed = readProgress();
  return <main className="learn-page page-width">
    <header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('tutorial.eyebrow')}</p><h1>{t('tutorial.title')}</h1><p>{t('tutorial.intro')}</p><p className="progress-copy">{t('tutorial.progress', { done: completed.length, total: LESSONS.length })}</p></header>
    <div className="lesson-grid">{LESSONS.map((lesson, index) => <Link className={`lesson-card${completed.includes(lesson.id) ? ' is-done' : ''}`} to={`/learn/${lesson.id}`} key={lesson.id}>
      <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><b>{t(`lessons.${lesson.id}.title`)}</b><small>{t(`lessons.${lesson.id}.summary`)}</small></span>{completed.includes(lesson.id) ? <Check size={18} aria-label={t('tutorial.done')} /> : <ArrowRight size={18} aria-hidden />}
    </Link>)}</div>
  </main>;
}

function SetupLesson({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const { t } = useTranslation();
  const game = useMemo(() => makeLessonGame(lesson), [lesson]);
  const [selected, setSelected] = useState<PieceType>('e');
  const [done, setDone] = useState(false);
  const clickSquare = (square: number) => {
    if (done) return;
    const uci = `${selected.toUpperCase()}@${squareName(square)}`;
    if (!game.legalUci().includes(uci)) return;
    game.move(uci);
    setDone(true);
    onComplete();
  };
  return <>
    <ArimaaBoard game={game} orientation="w" disabled={done} onSquare={clickSquare} />
    <Card className="setup-tray tutorial-setup">
      <p className="field-label">{t('setup.chooseSetup')}</p>
      <p>{t('setup.setupHint')}</p>
      <button type="button" aria-pressed className="tray-piece is-active" onClick={() => setSelected('e')}><PieceMark piece={{ color: 'w', type: 'e', promoted: false }} compact /><span>{t('pieces.e')}</span><b>1</b></button>
      {done && <p className="feedback is-correct" role="status"><Check size={17} aria-hidden />{t('tutorial.correct')}</p>}
    </Card>
  </>;
}

function MoveLesson({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const { t } = useTranslation();
  const game = useMemo(() => makeLessonGame(lesson), [lesson]);
  const [resultGame, setResultGame] = useState<Game | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'illegal' | null>(null);
  const [reset, setReset] = useState(0);

  const commit = (uci: string) => {
    const attempt = makeLessonGame(lesson);
    try {
      attempt.move(uci);
      if (lesson.solutions?.includes(uci)) {
        setResultGame(attempt);
        setFeedback('correct');
        onComplete();
      } else setFeedback('wrong');
    } catch {
      setFeedback('illegal');
    }
  };

  return <>
    {resultGame
      ? <ArimaaBoard game={resultGame} orientation={game.turn} disabled />
      : <TurnEditor key={`${lesson.id}-${reset}`} game={game} disabled={false} onCommit={commit} />}
    {feedback && <p className={`feedback${feedback === 'correct' ? ' is-correct' : ' is-wrong'}`} role="status">{feedback === 'correct' ? <Check size={17} aria-hidden /> : <RotateCcw size={17} aria-hidden />}{t(`tutorial.${feedback}`)}</p>}
    {feedback === 'wrong' && <Button variant="secondary" size="sm" onClick={() => { setFeedback(null); setReset((value) => value + 1); }}>{t('tutorial.reset')}</Button>}
  </>;
}

function QuizLesson({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const { t } = useTranslation();
  const game = useMemo(() => makeLessonGame(lesson), [lesson]);
  const correct = quizAnswer(lesson, game);
  const [answer, setAnswer] = useState<string | null>(null);
  const isCorrect = answer === correct;
  return <>
    <Card className="quiz-card"><p className="field-label">{t('tutorial.quizPrompt')}</p><ArimaaBoard game={game} orientation={game.turn} disabled /></Card>
    <div className="quiz-choices" role="group" aria-label={t('tutorial.quizPrompt')}>
      {lesson.choices?.map((choice) => <button type="button" key={choice} aria-pressed={answer === choice} className={`quiz-choice${answer === choice ? isCorrect ? ' is-correct' : ' is-wrong' : ''}`} onClick={() => { setAnswer(choice); if (choice === correct) onComplete(); }}>{t(`quiz.${choice}`)}</button>)}
    </div>
    {answer && <p className={`feedback${isCorrect ? ' is-correct' : ' is-wrong'}`} role="status">{isCorrect ? t('tutorial.correct') : t('tutorial.wrong')}</p>}
  </>;
}

function LessonScreen({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  const index = LESSONS.findIndex((item) => item.id === lesson.id);
  const next = LESSONS[index + 1];
  const [complete, setComplete] = useState(readProgress().includes(lesson.id));
  const onComplete = () => { saveLesson(lesson.id); setComplete(true); };

  return <main className="lesson-page page-width">
    <header className="page-heading lesson-heading"><Link className="back-link" to="/learn"><ArrowLeft size={16} aria-hidden />{t('tutorial.back')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('tutorial.step', { current: index + 1, total: LESSONS.length })}</p><h1>{t(`lessons.${lesson.id}.title`)}</h1><p>{t(`lessons.${lesson.id}.summary`)}</p><strong className="lesson-task">{t(`lessons.${lesson.id}.task`)}</strong></header>
    <section className="lesson-exercise">
      {lesson.kind === 'setup' && <SetupLesson lesson={lesson} onComplete={onComplete} />}
      {lesson.kind === 'move' && <MoveLesson lesson={lesson} onComplete={onComplete} />}
      {lesson.kind === 'quiz' && <QuizLesson lesson={lesson} onComplete={onComplete} />}
    </section>
    <footer className="lesson-navigation">
      {complete && <span className="feedback is-correct"><Check size={17} aria-hidden />{t('tutorial.complete')}</span>}
      {next ? <Link className="next-lesson" to={`/learn/${next.id}`}>{t('tutorial.next')}<ArrowRight size={17} aria-hidden /></Link> : <Link className="next-lesson" to="/learn">{t('tutorial.complete')}<BookOpen size={17} aria-hidden /></Link>}
    </footer>
  </main>;
}

export function LessonRoute() {
  const { lessonId = '' } = useParams();
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) return <Navigate to="/learn" replace />;
  return <LessonScreen key={lesson.id} lesson={lesson} />;
}

export function lessonStartingGame(lesson: Lesson): Game {
  return makeLessonGame(lesson);
}
