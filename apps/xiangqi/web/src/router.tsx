import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './components/AppShell';
import { DesignPage } from './DesignPage';
import { ComputerGamePage } from './pages/ComputerGamePage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { LocalGamePage } from './pages/LocalGamePage';
import { OnlineGameRoute } from './pages/OnlineGamePage';
import { OnlinePage } from './pages/OnlinePage';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'play/local', element: <LocalGamePage /> },
      { path: 'play/computer', element: <ComputerGamePage /> },
      { path: 'play/online', element: <OnlinePage /> },
      { path: 'play/online/:code', element: <OnlineGameRoute /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'learn/:lessonId', element: <LessonPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'design', element: <DesignPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
