import { latinize, matchesArea, matchesName, skeleton } from './search';

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

describe('search by area', () => {
  const siRacha = ['Сирача', 'Si Racha'];
  const bangSaen = ['Бангсаен', 'Bang Saen'];

  it('finds Si Racha by Sriracha and Sri Racha', () => {
    expect(matchesArea(siRacha, 'Sriracha')).toBe(true);
    expect(matchesArea(siRacha, 'Sri Racha')).toBe(true);
    expect(matchesArea(siRacha, 'сирача')).toBe(true);
    expect(matchesArea(['Сирача', null], 'Sriracha')).toBe(true);
  });

  it('finds Bang Saen by Bangsaen', () => {
    expect(matchesArea(bangSaen, 'Bangsaen')).toBe(true);
    expect(matchesArea(['Бангсаен', null], 'Bangsaen')).toBe(true);
    expect(matchesArea(bangSaen, 'Бангсаен')).toBe(true);
  });

  it('does not match short or unrelated queries by sound', () => {
    expect(matchesArea(['Паттайя', 'Pattaya'], 'pet')).toBe(false);
    expect(matchesArea(siRacha, 'Bangsaen')).toBe(false);
    expect(matchesArea([null], 'Sriracha')).toBe(false);
  });
});
