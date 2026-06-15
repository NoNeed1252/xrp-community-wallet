import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles.css';
import './lib/i18n';
import { App } from './app/App';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
