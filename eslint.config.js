import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.claude'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Строки интерфейса только из src/i18n/ru.ts. Комментарии не проверяются (это не узлы AST).
    files: ['src/screens/**/*.tsx', 'src/components/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[А-Яа-яЁё]/]',
          message: 'Строки интерфейса берите из src/i18n/ru.ts.',
        },
        {
          selector: 'JSXText[value=/[А-Яа-яЁё]/]',
          message: 'Строки интерфейса берите из src/i18n/ru.ts.',
        },
        {
          selector: 'TemplateElement[value.raw=/[А-Яа-яЁё]/]',
          message: 'Строки интерфейса берите из src/i18n/ru.ts.',
        },
      ],
    },
  },
);
