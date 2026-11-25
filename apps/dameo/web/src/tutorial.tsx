import { storageKey, type Lesson } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { dameo } from '@chaturanga/dameo';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';
import { ALL_LESSONS } from './lessons/lessons';

export const lessonStarsKey = (lessonId: string) => storageKey(PRODUCT, `lesson.${lessonId}.stars`);
export const tutorialStarsKey = lessonStarsKey('the-opening-field');

export function DameoTutorial({ lesson }: { lesson: Lesson }) {
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
      variant={dameo}
      lesson={lesson}
      translate={(text) => text.en ?? ''}
      onExit={() => navigate('/learn')}
      onFinish={finish}
      routeChoiceTitle={t('play.chooseRoute')}
    />
  );
}

export function FirstLesson() {
  return <DameoTutorial lesson={ALL_LESSONS[0]!} />;
}
