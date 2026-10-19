// Фикстура для src/lint-rules.test.ts: намеренный цикл импортов.
import { a } from './a';
export const b = () => a;
