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
    catalog: { empty: 'Каталог заведений появится здесь' },
    bookings: { empty: 'У вас пока нет записей' },
    shop: { empty: 'Раздел «Товары» скоро появится' },
    pet: { empty: 'Профиль питомца скоро появится' },
  },
} as const;

export type TabId = keyof typeof ru.tabs;
