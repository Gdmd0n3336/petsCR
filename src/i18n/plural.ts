const ruRules = new Intl.PluralRules('ru');
const enRules = new Intl.PluralRules('en');

/** Русские формы: 1 отзыв, 2 отзыва, 5 отзывов; дробные — как «много». */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const form = ruRules.select(n);
  return form === 'one' ? one : form === 'few' ? few : many;
}

export function enPlural(n: number, one: string, other: string): string {
  return enRules.select(n) === 'one' ? one : other;
}
