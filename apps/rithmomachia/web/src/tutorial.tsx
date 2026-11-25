import { storageKey, type Lesson } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { rithmomachia, squareName } from '@chaturanga/rithmomachia';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { promotionName, useBoardIdentity } from './board';
import { pieceInfo } from './components/PieceArt';
import { ALL_LESSONS } from './lessons/lessons';

export const lessonStarsKey = (lessonId: string) => storageKey(PRODUCT, `lesson.${lessonId}.stars`);
export const tutorialStarsKey = lessonStarsKey(ALL_LESSONS[0]!.id);

export function RithmomachiaTutorial({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(lessonStarsKey(lesson.id), String(stars));
    navigate('/learn');
  };
  return (
    <LessonPlayer
      {...board}
      variant={rithmomachia}
      lesson={lesson}
      translate={(text) => text.en ?? ''}
      onExit={() => navigate('/learn')}
      onFinish={finish}
      routeChoiceTitle={t('play.chooseCapture')}
      describeRouteChoice={(uci, path) => {
        const route = path.map(squareName).join(' → ');
        const suffix = uci.slice(-1);
        return /^[a-vz]$/.test(suffix) ? `${route} · ${promotionName(suffix, 'b', t)}` : route;
      }}
      handLabel={(color) => t('play.reserve', { color: t(`colors.${color}`) })}
      describeHandPiece={(type, count) => {
        const info = pieceInfo(type, 'w');
        return t('play.reservePiece', { name: `${t(`shapes.${info.shape}`)} ${info.value}`, count });
      }}
    />
  );
}

export function FirstLesson() {
  return <RithmomachiaTutorial lesson={ALL_LESSONS[0]!} />;
}
