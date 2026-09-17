// Noto Sans (SIL OFL) for Latin text only; Chinese uses the system CJK font (D9). Subset entrypoints only.
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DesignPage } from './DesignPage';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignPage />
  </StrictMode>,
);
