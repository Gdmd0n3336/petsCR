import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// jsdom по умолчанию сообщает en-US; приложение по умолчанию русское, тесты тоже.
Object.defineProperty(window.navigator, 'language', { value: 'ru-RU', configurable: true });
Object.defineProperty(window.navigator, 'languages', { value: ['ru-RU'], configurable: true });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});
