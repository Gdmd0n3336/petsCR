import { ESLint } from 'eslint';

const cyrillic = 'export const A = () => <p>Привет</p>;\n';
const comment = '// комментарий по-русски\nexport const A = () => <p>{"ok"}</p>;\n';

async function restricted(code: string, filePath: string) {
  const [result] = await new ESLint().lintText(code, { filePath });
  // Защита от «пустого» прохода: файл должен реально проверяться и разбираться.
  expect(result, `${filePath} was not linted`).toBeDefined();
  expect(result!.messages.filter((m) => m.fatal)).toEqual([]);
  expect(result!.messages.some((m) => m.message.includes('File ignored'))).toBe(false);
  return result!.messages.filter((m) => m.ruleId === 'no-restricted-syntax');
}

describe('eslint: cyrillic literals', () => {
  it.each(['src/App.tsx', 'src/screens/Example.tsx', 'src/components/Example.tsx'])(
    'flags cyrillic in %s',
    async (filePath) => {
      expect(await restricted(cyrillic, filePath)).toHaveLength(1);
    },
  );

  it('allows cyrillic in ru.ts, tests and comments', async () => {
    expect(await restricted('export const ru = { a: "Привет" };\n', 'src/i18n/ru.ts')).toHaveLength(
      0,
    );
    expect(await restricted(cyrillic, 'src/components/Example.test.tsx')).toHaveLength(0);
    expect(await restricted(comment, 'src/components/Example.tsx')).toHaveLength(0);
  });
});

describe('eslint: import cycles (import-x/no-cycle)', () => {
  it('reports the intentional cycle in src/test/fixtures/cycle', async () => {
    const results = await new ESLint({ ignore: false }).lintFiles(['src/test/fixtures/cycle']);
    const cycles = results
      .flatMap((r) => r.messages)
      .filter((m) => m.ruleId === 'import-x/no-cycle');
    expect(results).toHaveLength(2);
    expect(cycles).toHaveLength(2);
  });
});
