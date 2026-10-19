import js from '@eslint/js';
import globals from 'globals';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const useRuStrings = 'Строки интерфейса берите из src/i18n/ru.ts.';

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.claude', 'src/test/fixtures'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, 'import-x': importX },
    settings: {
      // Замена madge (несовместим с TS 6): только проверка циклов, без остальных правил import-x.
      // Без import-x/parsers плагин не разбирает .ts-зависимости и молча пропускает циклы.
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import-x/resolver-next': [createNodeResolver({ extensions: ['.ts', '.tsx', '.js'] })],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'import-x/no-cycle': 'error',
    },
  },
  {
    // Строки интерфейса только из src/i18n/ru.ts. Комментарии не проверяются (это не узлы AST).
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'Literal[value=/[А-Яа-яЁё]/]', message: useRuStrings },
        { selector: 'JSXText[value=/[А-Яа-яЁё]/]', message: useRuStrings },
        { selector: 'TemplateElement[value.raw=/[А-Яа-яЁё]/]', message: useRuStrings },
      ],
    },
  },
);
