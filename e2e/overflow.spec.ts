import { expect, test, type Page } from '@playwright/test';

// Нет горизонтального переполнения ни на одном экране: ни один элемент не выходит за края
// окна (полоса чипов прокручивается внутри себя — проверяется сама полоса, не чипы).
// Безопасные зоны iPhone эмулируются через DevTools (Emulation.setSafeAreaInsetsOverride).

const VENUE = 'ebaa0d79-792d-54ce-ba9b-c6f3127bcb26';
const ROUTES = ['/', '/catalog', `/venue/${VENUE}`, '/bookings', '/shop', '/pet'];
const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 1024, 1440];

async function outside(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const problems = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => !el.parentElement?.closest('.filters__strip'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0 && (r.left < -0.5 || r.right > vw + 0.5))
      .map(
        ({ el, r }) => `${el.tagName}.${el.className} ${r.left.toFixed(1)}…${r.right.toFixed(1)}`,
      );
    if (document.documentElement.scrollWidth > vw)
      problems.push(`scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    return problems;
  });
}

for (const safeArea of [false, true]) {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px${safeArea ? ' with iPhone safe areas' : ''}`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      if (safeArea) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setSafeAreaInsetsOverride', {
          insets: { top: 59, bottom: 34, left: 0, right: 0 },
        });
      }
      for (const route of ROUTES) {
        await page.goto(`#${route}`);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.getByText('Загружаем…')).toHaveCount(0);
        expect(await outside(page), `${route} at ${width}px`).toEqual([]);
      }
      // открытая шторка выбора
      await page.goto('#/catalog');
      await page.getByRole('button', { name: /^Район:/ }).click();
      expect(await outside(page), `area sheet at ${width}px`).toEqual([]);
    });
  }
}
