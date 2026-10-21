import { latinize, matchesName, skeleton } from './search';

describe('search by name', () => {
  it('finds Latin by Cyrillic transliteration and back', () => {
    expect(matchesName(['Bay Vet Clinic'], 'Бэй Вет')).toBe(true);
    expect(matchesName(['Бэй Вет'], 'Bay Vet')).toBe(true);
    expect(matchesName(['Dogtown Pet Clinic'], 'догтаун')).toBe(true);
    expect(matchesName(['Jomtien Pet Hospital'], 'Джомтьен')).toBe(true);
  });

  it('ignores case, spaces and punctuation', () => {
    expect(matchesName(['Dr. Nueng Veterinary'], 'dr nueng')).toBe(true);
    expect(matchesName(['PET FRIENDS'], 'pet-friends')).toBe(true);
  });

  it('matches Thai as a substring', () => {
    expect(matchesName(['โรงพยาบาลสัตว์เพ็ทเฟรนด์ ศรีราชา'], 'เพ็ทเฟรนด์')).toBe(true);
    expect(matchesName(['โรงพยาบาลสัตว์เพ็ทเฟรนด์'], 'อุ้มรัก')).toBe(false);
  });

  it('does not match unrelated names and treats an empty query as a match', () => {
    expect(matchesName(['Dogtown Pet Clinic'], 'Ум Рак')).toBe(false);
    expect(matchesName([null, 'Anything'], '  ')).toBe(true);
    expect(matchesName([null], 'x')).toBe(false);
  });

  it('builds the latin skeleton', () => {
    expect(latinize('Бэй Вет')).toBe('beyvet');
    expect(skeleton('bayvet')).toBe(skeleton('beyvet'));
  });
});
