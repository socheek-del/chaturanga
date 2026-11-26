export interface QuizLesson {
  id: string;
  topic: string;
  kind: 'quiz';
  answer: number;
}

export interface BoardLesson {
  id: string;
  topic: string;
  kind: 'board';
}

export type TutorialLesson = QuizLesson | BoardLesson;

/** A compact path through every rule needed for a first complete game. */
export const TUTORIAL_LESSONS: readonly TutorialLesson[] = [
  { id: 'four-armies', topic: 'seats', kind: 'quiz', answer: 0 },
  { id: 'turn-order', topic: 'turn-order', kind: 'quiz', answer: 1 },
  { id: 'dice-one-five', topic: 'dice', kind: 'quiz', answer: 0 },
  { id: 'make-a-move', topic: 'movement', kind: 'board' },
  { id: 'dice-two-three', topic: 'dice', kind: 'quiz', answer: 2 },
  { id: 'elephant-and-boat', topic: 'movement', kind: 'quiz', answer: 1 },
  { id: 'pawns', topic: 'pawns', kind: 'quiz', answer: 0 },
  { id: 'no-check', topic: 'check', kind: 'quiz', answer: 2 },
  { id: 'capture-points', topic: 'scoring', kind: 'quiz', answer: 1 },
  { id: 'promotion', topic: 'promotion', kind: 'quiz', answer: 0 },
  { id: 'boat-triumph', topic: 'boat-triumph', kind: 'quiz', answer: 2 },
  { id: 'allied-throne', topic: 'throne', kind: 'quiz', answer: 1 },
  { id: 'game-end', topic: 'ending', kind: 'quiz', answer: 0 },
];
