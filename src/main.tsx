import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTelegramLaunch } from './lib/launch';
import { initTelegram } from './lib/telegram';
import './fonts.css';
import '../design/tokens.css';
import './styles.css';

applyTelegramLaunch(initTelegram());

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
