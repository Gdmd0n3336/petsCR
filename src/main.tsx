import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initTelegram } from './lib/telegram';

initTelegram();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<StrictMode>Lapa</StrictMode>);
}
