import { areaName, venueName, venueTransliteration } from './names';

const full = {
  name_original: 'โรงพยาบาลสัตว์อุ้มรัก',
  name_th: 'โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา',
  name_en: 'Um Rak Animal Hospital',
  name_ru: 'Ветбольница Ум Рак',
};

describe('venueName (rule 1)', () => {
  it('shows the original name in any interface language, never translated', () => {
    expect(venueName(full)).toBe('โรงพยาบาลสัตว์อุ้มรัก');
  });

  it('falls back to name_th, then name_en, then name_ru', () => {
    expect(venueName({ ...full, name_original: null })).toBe('โรงพยาบาลสัตว์อุ้มรัก อ่างศิลา');
    expect(venueName({ ...full, name_original: null, name_th: null })).toBe(
      'Um Rak Animal Hospital',
    );
    expect(
      venueName({ name_original: null, name_th: null, name_en: null, name_ru: 'Ум Рак' }),
    ).toBe('Ум Рак');
  });
});

describe('venueTransliteration', () => {
  it('offers name_ru in Russian and name_en in English', () => {
    expect(venueTransliteration(full, 'ru')).toBe('Ветбольница Ум Рак');
    expect(venueTransliteration(full, 'en')).toBe('Um Rak Animal Hospital');
  });

  it('offers nothing when the field is empty or equals the original', () => {
    expect(venueTransliteration({ ...full, name_ru: null }, 'ru')).toBeNull();
    expect(
      venueTransliteration({ ...full, name_original: 'Dogtown', name_en: 'Dogtown' }, 'en'),
    ).toBeNull();
  });
});

describe('areaName', () => {
  it('uses area_en in English and falls back to area_ru without errors', () => {
    expect(areaName({ area_ru: 'Сирача', area_en: 'Si Racha' }, 'en')).toBe('Si Racha');
    expect(areaName({ area_ru: 'Сирача', area_en: 'Si Racha' }, 'ru')).toBe('Сирача');
    expect(areaName({ area_ru: 'Бангсаен', area_en: null }, 'en')).toBe('Бангсаен');
    expect(areaName({ area_ru: null, area_en: null }, 'en')).toBeNull();
  });
});
