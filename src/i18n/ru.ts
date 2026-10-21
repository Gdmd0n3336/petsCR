import { ruPlural } from './plural';

const reviewsWord = (n: number) => ruPlural(n, 'отзыв', 'отзыва', 'отзывов');

export const ru = {
  appName: 'Lapa',
  tabsLabel: 'Разделы',
  tabs: {
    nearby: 'Рядом',
    catalog: 'Каталог',
    bookings: 'Записи',
    shop: 'Товары',
    pet: 'Питомец',
  },
  state: {
    loading: 'Загружаем…',
    empty: 'Здесь пока пусто',
    error: 'Не удалось загрузить данные',
    retry: 'Повторить',
    soon: 'Скоро',
  },
  screens: {
    nearby: { empty: 'Здесь появятся клиники, груминг и передержки рядом с вами' },
    catalog: { empty: 'Заведений пока нет' },
    bookings: { empty: 'У вас пока нет записей' },
    shop: { empty: 'Раздел «Товары» скоро появится' },
    pet: { empty: 'Профиль питомца скоро появится' },
  },
  sampleBanner: 'Тестовый режим: образец данных',
  demoBadge: 'демо-данные',
  name: {
    transliterate: 'По-русски',
    original: 'Оригинал',
    transliterationLabel: 'транслитерация',
  },
  lang: {
    label: 'Язык интерфейса',
    ru: 'RU',
    en: 'EN',
    ruName: 'Русский',
    enName: 'English',
  },
  catalog: {
    searchLabel: 'Поиск по названию',
    searchPlaceholder: 'Название, например Pet Friends',
    filtersLabel: 'Фильтры',
    only24: 'Круглосуточно',
    withPhone: 'Есть телефон',
    district: 'Район',
    allDistricts: 'Все районы',
    sortLabel: 'Сортировка',
    sort: {
      google_rating: 'По рейтингу Google',
      reviews_count: 'По числу отзывов',
      distance: 'По расстоянию',
    },
    useLocation: 'Учесть, где я',
    locating: 'Определяем местоположение…',
    found: (n: number) => `Найдено: ${n}`,
    noResults: 'Ничего не нашлось. Измените запрос или фильтры.',
    reset: 'Сбросить фильтры',
    view: { label: 'Вид каталога', list: 'Список', map: 'Карта' },
  },
  map: {
    label: 'Карта заведений',
    loading: 'Загружаем карту…',
    noKey: 'Карта пока не подключена. Ниже — список заведений.',
    unavailable: 'Карта сейчас недоступна. Ниже — список заведений.',
    nearMe: 'Рядом со мной',
    open: 'Открыть',
    closePreview: 'Закрыть',
    you: 'Вы здесь',
    cluster: (n: number) => `Заведений здесь: ${n}. Нажмите, чтобы приблизить`,
    noCoords: (n: number) => `Без координат на карте: ${n}`,
  },
  venue: {
    back: 'Назад',
    notFound: 'Заведение не найдено',
    category: {
      vet_clinic: 'Ветклиника',
      grooming: 'Груминг',
      boarding: 'Передержка',
      pet_shop: 'Зоомагазин',
    },
    is247: 'Круглосуточно',
    ratingsTitle: 'Рейтинги',
    google: (rating: string, n: number) => `Google ${rating} · ${n} ${reviewsWord(n)}`,
    googleCount: (n: number) => `Google · ${n} ${reviewsWord(n)}`,
    googleNone: 'Рейтинга Google нет',
    googleSource: 'Данные Google Карт',
    collected: (n: number, avg: string) => `Собрано отзывов: ${n}, средняя оценка ${avg}`,
    collectedSource: 'По отзывам, собранным Lapa',
    collectedNone: 'Собранных отзывов пока нет',
    ratingOutOf5: (rating: string) => `Оценка ${rating} из 5`,
    actionsLabel: 'Действия',
    call: 'Позвонить',
    route: 'Маршрут',
    website: 'Сайт',
    share: 'Поделиться',
    book: 'Записаться или спросить',
    address: 'Адрес',
    hours: 'Часы работы',
    open24: 'круглосуточно',
    closed: 'выходной',
    allWeek24: 'Круглосуточно, без выходных',
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    distance: (km: string) => `${km} км`,
    soonTitle: 'Скоро',
    soonText:
      'Запись и вопросы клинике через Lapa появятся в ближайшее время. Пока можно позвонить.',
    close: 'Закрыть',
  },
  reviews: {
    title: 'Отзывы',
    sortLabel: 'Порядок отзывов',
    newest: 'Новые',
    lowest: 'Сначала низкие оценки',
    ratingFilter: 'Оценка',
    allRatings: 'Все оценки',
    stars: (n: number) => `${n} ★`,
    more: 'Показать ещё',
    empty: 'Отзывов пока нет',
    emptyFiltered: 'Нет отзывов с такой оценкой',
    auto: 'Автоперевод',
    soon: 'Перевод скоро',
    original: 'Оригинал',
    showOriginal: 'Показать оригинал',
    showTranslation: 'Показать перевод',
    expand: 'Показать полностью',
    collapse: 'Свернуть',
    anonymous: 'Без имени',
    price: (amount: string) => `Стоимость: ${amount}`,
  },
} as const;

export type TabId = keyof typeof ru.tabs;

/** Тип словаря: структура ru, но строки — любые строки (для en.ts). */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : T extends readonly string[]
      ? readonly string[]
      : { readonly [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof ru>;
