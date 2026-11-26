import { Game, koShogi, fenOf, makePiece, squareOf, startingPosition, type PieceType, type Position } from '@chaturanga/ko-shogi';
import type { Lesson, Unit } from '@chaturanga/game-shell';

export interface KoShogiLesson extends Lesson {
  coverage: readonly string[];
}

interface KoShogiUnit extends Omit<Unit, 'lessons'> {
  lessons: KoShogiLesson[];
}

const en = (text: string) => ({ en: text });

function exercisePosition(turn: 'w' | 'b' = 'w'): Position {
  const position: Position = {
    board: Array.from({ length: 19 * 19 }, () => null),
    turn,
    priestLost: { w: false, b: false },
  };
  position.board[squareOf('a1')!] = makePiece('w', 'general');
  position.board[squareOf('s19')!] = makePiece('b', 'general');
  return position;
}

function put(position: Position, square: string, color: 'w' | 'b', type: PieceType, promoted = false): Position {
  position.board[squareOf(square)!] = makePiece(color, type, promoted);
  return position;
}

function fen(position: Position): string { return fenOf(position); }

const elephant = fen(put(exercisePosition(), 'e5', 'w', 'elephant'));
const master = fen(put(exercisePosition(), 'e5', 'w', 'master-at-arms', true));
const longbowPosition = put(exercisePosition(), 'e5', 'w', 'longbow');
put(longbowPosition, 'h8', 'b', 'pawn');
const longbow = fen(longbowPosition);
const cannonPosition = put(exercisePosition(), 'e5', 'w', 'cannon');
put(cannonPosition, 'g7', 'w', 'pawn');
put(cannonPosition, 'h8', 'b', 'pawn');
const cannon = fen(cannonPosition);
const campPosition = put(exercisePosition(), 'm13', 'w', 'aide');
const camp = fen(campPosition);
const capturePosition = put(exercisePosition(), 'e5', 'w', 'clerk');
put(capturePosition, 'g5', 'b', 'middle-troop');
const capture = fen(capturePosition);
const priestPosition = put(exercisePosition(), 'e4', 'w', 'chariot-unit', true);
put(priestPosition, 'e5', 'b', 'taoist-priest');
put(priestPosition, 'h10', 'b', 'flag-waver', true);
put(priestPosition, 'h12', 'b', 'thunderclap', true);
const priest = fen(priestPosition);
const flamePosition = put(exercisePosition(), 'e5', 'w', 'poison-flame', true);
put(flamePosition, 'f6', 'b', 'pawn');
put(flamePosition, 'e7', 'w', 'pawn');
const flame = fen(flamePosition);
const effectsPosition = put(exercisePosition(), 'e5', 'w', 'cannon');
put(effectsPosition, 'h5', 'b', 'five-li-fog', true);
put(effectsPosition, 'e10', 'b', 'earthward-net', true);
put(effectsPosition, 'e14', 'w', 'pawn');
const effects = fen(effectsPosition);

export const LESSON_UNITS: readonly KoShogiUnit[] = [
  {
    id: 'field-notes', title: en('tutorial.content.item001'), lessons: [
      {
        id: 'read-the-formation', icon: 'tutorial.icons.formation', title: en('tutorial.content.item002'),
        summary: en('tutorial.content.item003'), xp: 20,
        coverage: ['opening', 'orientation'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item004'), fen: koShogi.startFen },
          { kind: 'quiz', text: en('tutorial.content.item005'), choices: [en('tutorial.content.item006'), en('tutorial.content.item007'), en('tutorial.content.item008')], correct: 0, hint: en('tutorial.content.item009') },
          { kind: 'info', text: en('tutorial.content.item010'), fen: elephant, highlight: ['e5'] },
        ],
      },
      {
        id: 'read-the-lines', icon: 'tutorial.icons.fieldKey', title: en('tutorial.content.item011'),
        summary: en('tutorial.content.item012'), xp: 20,
        coverage: ['movement'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item013'), fen: koShogi.startFen },
          { kind: 'quiz', text: en('tutorial.content.item014'), choices: [en('tutorial.content.item015'), en('tutorial.content.item016'), en('tutorial.content.item017')], correct: 1, hint: en('tutorial.content.item018') },
        ],
      },
    ],
  },
  {
    id: 'routes-and-fire', title: en('tutorial.content.item019'), lessons: [
      {
        id: 'two-legs-one-turn', icon: 'tutorial.icons.route', title: en('tutorial.content.item020'),
        summary: en('tutorial.content.item021'), xp: 25,
        coverage: ['compound-routes'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item022'), fen: master, highlight: ['e5'] },
          { kind: 'move', text: en('tutorial.content.item023'), fen: master, solutions: ['e5-f6-g7'], hint: en('tutorial.content.item024') },
        ],
      },
      {
        id: 'move-then-shoot', icon: 'tutorial.icons.shot', title: en('tutorial.content.item025'),
        summary: en('tutorial.content.item026'), xp: 25,
        coverage: ['move-before-shot', 'shot-range-immunity'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item027'), fen: longbow, highlight: ['e5', 'h8'] },
          { kind: 'move', text: en('tutorial.content.item028'), fen: longbow, solutions: ['e5-f6@h8'], hint: en('tutorial.content.item029') },
        ],
      },
      {
        id: 'cannon-screen', icon: 'tutorial.icons.screen', title: en('tutorial.content.item030'),
        summary: en('tutorial.content.item031'), xp: 20,
        coverage: ['cannon-screen'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item032'), fen: cannon, highlight: ['g7', 'h8'] },
          { kind: 'move', text: en('tutorial.content.item033'), fen: cannon, solutions: ['e5-f6@h8'], hint: en('tutorial.content.item034') },
          { kind: 'quiz', text: en('tutorial.content.item035'), choices: [en('tutorial.content.item036'), en('tutorial.content.item037'), en('tutorial.content.item038')], correct: 1, hint: en('tutorial.content.item039') },
        ],
      },
    ],
  },
  {
    id: 'promotion-and-duty', title: en('tutorial.content.item040'), lessons: [
      {
        id: 'two-ways-to-promote', icon: 'tutorial.icons.promote', title: en('tutorial.content.item041'),
        summary: en('tutorial.content.item042'), xp: 25,
        coverage: ['camp-promotion', 'capture-promotion'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item043'), fen: camp, highlight: ['m13', 'm14'] },
          { kind: 'move', text: en('tutorial.content.item044'), fen: camp, solutions: ['m13-m14=town-brigade'], hint: en('tutorial.content.item045') },
          { kind: 'move', text: en('tutorial.content.item046'), fen: capture, solutions: ['e5-g5'], hint: en('tutorial.content.item047') },
        ],
      },
      {
        id: 'priests-and-banners', icon: 'tutorial.icons.priests', title: en('tutorial.content.item048'),
        summary: en('tutorial.content.item049'), xp: 25,
        coverage: ['banner-drum-priests'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item050'), fen: priest, highlight: ['e5', 'h10', 'h12'] },
          { kind: 'move', text: en('tutorial.content.item051'), fen: priest, solutions: ['e4-e5'], hint: en('tutorial.content.item052') },
          { kind: 'quiz', text: en('tutorial.content.item053'), choices: [en('tutorial.content.item054'), en('tutorial.content.item055'), en('tutorial.content.item056')], correct: 0, hint: en('tutorial.content.item057') },
        ],
      },
    ],
  },
  {
    id: 'field-effects', title: en('tutorial.content.item058'), lessons: [
      {
        id: 'poison-flame', icon: 'tutorial.icons.burn', title: en('tutorial.content.item059'),
        summary: en('tutorial.content.item060'), xp: 20,
        coverage: ['poison-flame'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item061'), fen: flame, highlight: ['f6', 'e7'] },
          { kind: 'move', text: en('tutorial.content.item062'), fen: flame, solutions: ['e5-e6'], hint: en('tutorial.content.item063') },
        ],
      },
      {
        id: 'fog-light-and-nets', icon: 'tutorial.icons.range', title: en('tutorial.content.item064'),
        summary: en('tutorial.content.item065'), xp: 30,
        coverage: ['fog-suppression', 'immaculate-light', 'nets'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item066'), fen: effects, highlight: ['e5', 'h5'] },
          { kind: 'quiz', text: en('tutorial.content.item067'), choices: [en('tutorial.content.item068'), en('tutorial.content.item069'), en('tutorial.content.item070')], correct: 0, hint: en('tutorial.content.item071') },
          { kind: 'info', text: en('tutorial.content.item072'), fen: effects, highlight: ['e10', 'e14'] },
          { kind: 'quiz', text: en('tutorial.content.item073'), choices: [en('tutorial.content.item074'), en('tutorial.content.item075'), en('tutorial.content.item076')], correct: 0, hint: en('tutorial.content.item077') },
        ],
      },
    ],
  },
  {
    id: 'objectives-and-endings', title: en('tutorial.content.item078'), lessons: [
      {
        id: 'protect-the-command', icon: 'tutorial.icons.command', title: en('tutorial.content.item079'),
        summary: en('tutorial.content.item080'), xp: 25,
        coverage: ['command-objective'],
        steps: [
          { kind: 'info', text: en('tutorial.content.item081'), fen: koShogi.startFen },
          { kind: 'quiz', text: en('tutorial.content.item082'), choices: [en('tutorial.content.item083'), en('tutorial.content.item084'), en('tutorial.content.item085')], correct: 0, hint: en('tutorial.content.item086') },
        ],
      },
      {
        id: 'draws-and-no-move', icon: 'tutorial.icons.endings', title: en('tutorial.content.item087'),
        summary: en('tutorial.content.item088'), xp: 25,
        coverage: ['no-move-loss', 'repetition-perpetual-check', 'illegal-move-handling'],
        steps: [
          { kind: 'quiz', text: en('tutorial.content.item089'), choices: [en('tutorial.content.item090'), en('tutorial.content.item091'), en('tutorial.content.item092')], correct: 0, hint: en('tutorial.content.item093') },
          { kind: 'info', text: en('tutorial.content.item094'), fen: koShogi.startFen },
          { kind: 'quiz', text: en('tutorial.content.item095'), choices: [en('tutorial.content.item096'), en('tutorial.content.item097'), en('tutorial.content.item098')], correct: 0, hint: en('tutorial.content.item099') },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: readonly KoShogiLesson[] = LESSON_UNITS.flatMap((unit) => unit.lessons);

export function verifyLessonMoves(): void {
  for (const lesson of ALL_LESSONS) for (const step of lesson.steps) {
    if (step.kind !== 'move') continue;
    const game = new Game(step.fen);
    for (const solution of step.solutions) {
      const originName = solution.match(/^[a-s](?:1[0-9]|[1-9])/u)?.[0];
      if (!originName) throw new Error(`Lesson ${lesson.id} has invalid solution ${solution}`);
      const origin = squareOf(originName)!;
      if (!game.legalCandidatesFrom(origin).some((candidate) => candidate.uci === solution))
        throw new Error(`Lesson ${lesson.id} has illegal solution ${solution}`);
    }
  }
}

export const START_POSITION = fen(startingPosition());
