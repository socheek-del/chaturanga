import { Navigate, useNavigate, useParams } from 'react-router';
import { LessonPlayer } from '../features/learn/LessonPlayer';
import { findLesson } from '../features/learn/lessons';
import { useProgress } from '../stores/progress';

export function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const completeLesson = useProgress((s) => s.completeLesson);
  const lesson = findLesson(lessonId);

  if (!lesson) return <Navigate to="/learn" replace />;

  return (
    <LessonPlayer
      key={lesson.id}
      lesson={lesson}
      onExit={() => navigate('/learn')}
      onFinish={(stars) => {
        completeLesson(lesson.id, stars, lesson.xp);
        navigate('/learn');
      }}
    />
  );
}
