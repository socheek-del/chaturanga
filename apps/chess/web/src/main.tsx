// Noto Sans (SIL OFL) for Latin text only; Chinese uses the system CJK font (D9). Subset entrypoints only.
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './i18n';
import './index.css';
import { router } from './router';

// Precache the app shell so local play and the computer work offline; updates apply automatically.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
