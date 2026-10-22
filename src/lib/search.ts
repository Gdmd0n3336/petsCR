// Поиск по названию на трёх языках без нечёткого поиска и автоисправления.
// Кириллица переводится в латиницу по простой таблице, затем сравнивается «скелет» из согласных:
// так «Бэй Вет» находит «Bay Vet», а «Догтаун» — «Dogtown». Тайский сравнивается подстрокой.

const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Нижний регистр, без диакритики и знаков, кириллица — латиницей; тайские буквы остаются. */
export function latinize(text: string): string {
  return text
    .toLowerCase()
    .replace(/дж/g, 'j')
    .replace(/[а-яё]/g, (ch) => CYRILLIC[ch] ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

/** Согласные без гласных, w/y/h-диграфов и повторов: bayvet → bvt, dogtown → dgtn. */
export function skeleton(latin: string): string {
  return latin
    .replace(/[^a-z0-9]/g, '')
    .replace(/ph/g, 'f')
    .replace(/([kptdgbc])h/g, '$1')
    .replace(/[ck]/g, 'k')
    .replace(/[aeiouyw]/g, '')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Район: подстрока или совпадение «скелета» целиком (Sriracha / Sri Racha → Si Racha, Сирача).
 * Целиком и от 5 букв — чтобы короткие запросы вроде «pet» не находили всю «Pattaya».
 */
export function matchesArea(areas: readonly (string | null)[], query: string): boolean {
  const q = latinize(query);
  if (!q) return true;
  return areas.some((area) => {
    if (!area) return false;
    const a = latinize(area);
    return a.includes(q) || (q.length >= 5 && skeleton(a) === skeleton(q));
  });
}

export function matchesName(names: readonly (string | null)[], query: string): boolean {
  const q = latinize(query);
  if (!q) return true;
  // Сравнение по согласным — только для запросов от 5 букв: короткие вроде «pet»
  // иначе находят «Pattaya» почти в каждом названии.
  const qSkeleton = q.length >= 5 ? skeleton(q) : '';
  return names.some((name) => {
    if (!name) return false;
    const n = latinize(name);
    return n.includes(q) || (qSkeleton.length >= 3 && skeleton(n).includes(qSkeleton));
  });
}
