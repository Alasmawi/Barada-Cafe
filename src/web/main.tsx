import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installTouchFeedback } from './design/touchFeedback';
import '@fontsource/ultra';
import '@fontsource-variable/archivo';
import '@fontsource/jetbrains-mono/500.css';
import './design/tokens.css';
import './design/app.css';

installTouchFeedback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
