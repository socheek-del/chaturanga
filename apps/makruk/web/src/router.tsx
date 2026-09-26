import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './components/AppShell';
import { AboutPage } from './pages/AboutPage';
import { ComputerGamePage } from './pages/ComputerGamePage';
import { DesignPage } from './pages/DesignPage';
import { GamesPage } from './pages/GamesPage';
import { GuidedGamePage } from './pages/GuidedGamePage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { LocalGamePage } from './pages/LocalGamePage';
import { OnlineGameRoute } from './pages/OnlineGamePage';
import { OnlinePage } from './pages/OnlinePage';
import { ReviewPage } from './pages/ReviewPage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'play/local', element: <LocalGamePage /> },
      { path: 'play/computer', element: <ComputerGamePage /> },
      { path: 'play/guided', element: <GuidedGamePage /> },
      { path: 'play/online', element: <OnlinePage /> },
      { path: 'play/online/:code', element: <OnlineGameRoute /> },
      { path: 'games', element: <GamesPage /> },
      { path: 'games/:gameId', element: <ReviewPage /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'learn/:lessonId', element: <LessonPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'design', element: <DesignPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
