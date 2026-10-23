// @ts-expect-error -- .mjs-скрипт без типов
import { findFontProblems, findProblems } from './check-bundle.mjs';

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

  it('flags Google Fonts requests', () => {
    expect(
      findProblems({ 'a.css': '@import url(https://fonts.googleapis.com/css2?family=Inter)' }, 'x'),
    ).toEqual(['a.css: requests Google Fonts']);
  });

  it('requires Inter latin/cyrillic and Noto Sans Thai thai and nothing else', () => {
    const ok = [
      'inter-latin-wght-normal-a.woff2',
      'inter-cyrillic-wght-normal-b.woff2',
      'noto-sans-thai-thai-wght-normal-c.woff2',
    ];
    expect(findFontProblems(ok)).toEqual([]);
    expect(findFontProblems(ok.slice(1))).toEqual(['font missing: inter-latin-wght-normal']);
    expect(findFontProblems([...ok, 'manrope-latin-wght-normal-d.woff2'])).toEqual([
      'unexpected font file: manrope-latin-wght-normal-d.woff2',
    ]);
  });
});
