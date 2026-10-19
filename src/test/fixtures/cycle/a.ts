// Фикстура для src/lint-rules.test.ts: намеренный цикл импортов.
import { b } from './b';
export const a = () => b;
