// Prompt (SIL OFL) by Cadson Demak: Thai + Latin, self-hosted so the PWA works offline.
import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/600.css';
import '@fontsource/prompt/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './i18n';
import { startRecording } from './stores/recording';
import './index.css';
import { router } from './router';

// Precache the app shell so local play, the computer and lessons work offline; updates apply automatically.
registerSW({ immediate: true });

// Every game played on this device is saved as it is played, for Games and review (review-001).
startRecording();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
