// @ts-expect-error -- .mjs-скрипт без типов
import { findProblems } from './check-bundle.mjs';

const fakeKey = 'AIza' + 'x'.repeat(35);

describe('check-bundle', () => {
  it('flags anything that looks like a Google API key', () => {
    expect(findProblems({ 'a.js': `const k="${fakeKey}"` }, 'a.js')).toEqual([
      'a.js: looks like a Google API key',
    ]);
  });

  it('flags a Supabase project URL and sample data in the main chunk', () => {
    const problems = findProblems(
      {
        'index.js':
          'fetch("https://abcdefghijklmnopqrst.supabase.co");ade86fe0-92ce-5f34-b7df-42c973361822',
      },
      'index.js',
    );
    expect(problems).toHaveLength(2);
  });

  it('passes a clean build', () => {
    expect(findProblems({ 'index.js': 'console.log(1)' }, 'index.js')).toEqual([]);
  });
});
