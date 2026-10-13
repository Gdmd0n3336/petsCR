import { ESLint } from 'eslint';

// Проверяем, что правило «строки только из src/i18n/ru.ts» включено там, где нужно.
const eslint = new ESLint();
const cyrillic = 'export const A = () => <p>Привет</p>;\n';
const comment = '// комментарий по-русски\nexport const A = () => <p>{"ok"}</p>;\n';

async function messages(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-syntax');
}

describe('eslint: cyrillic literals', () => {
  it('flags cyrillic in src/screens and src/components', async () => {
    expect(await messages(cyrillic, 'src/screens/Example.tsx')).toHaveLength(1);
    expect(await messages(cyrillic, 'src/components/Example.tsx')).toHaveLength(1);
  });

  it('allows cyrillic in ru.ts, tests and comments', async () => {
    expect(await messages('export const ru = { a: "Привет" };\n', 'src/i18n/ru.ts')).toHaveLength(
      0,
    );
    expect(await messages(cyrillic, 'src/components/Example.test.tsx')).toHaveLength(0);
    expect(await messages(comment, 'src/components/Example.tsx')).toHaveLength(0);
  });
});
