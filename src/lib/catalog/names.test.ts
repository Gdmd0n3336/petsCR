import { venueName } from './names';

describe('venueName (rule 1)', () => {
  const full = { name_ru: 'Ветклиника', name_en: 'Vet Clinic', name_th: 'คลินิก' };
  it('uses the interface language', () => {
    expect(venueName(full, 'ru')).toBe('Ветклиника');
    expect(venueName(full, 'en')).toBe('Vet Clinic');
  });
  it('falls back to the Thai name, then any name', () => {
    expect(venueName({ ...full, name_ru: null }, 'ru')).toBe('คลินิก');
    expect(venueName({ ...full, name_en: null }, 'en')).toBe('คลินิก');
    expect(venueName({ name_ru: null, name_en: 'Vet', name_th: null }, 'ru')).toBe('Vet');
  });
});
