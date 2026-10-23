import { directionsUrl, telHref, telegramShareUrl, venueShareTarget, venueWebUrl } from './links';

describe('links', () => {
  it('builds tel: links with digits only', () => {
    expect(telHref('+66 38 773 007')).toBe('tel:+6638773007');
    expect(telHref('038 123 456, 081 234 5678')).toBe('tel:038123456');
    expect(telHref('038 123 456 / 081 234 5678')).toBe('tel:038123456');
  });

  it('builds Google Maps directions by coordinates', () => {
    expect(directionsUrl(12.93, 100.88)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12.93%2C100.88',
    );
    expect(directionsUrl(1, 2, 'ChIJabc')).toContain('destination_place_id=ChIJabc');
  });

  it('uses the configured base URL or the current page', () => {
    expect(venueWebUrl('v1', 'https://lapa.example/app')).toBe(
      'https://lapa.example/app#/venue/v1',
    );
    expect(venueWebUrl('v1', null)).toBe('http://localhost:3000/#/venue/v1');
    expect(venueShareTarget('v 1')).toMatch(/#\/venue\/v%201$/);
  });

  it('shares t.me/<bot>?startapp=venue_<id> when the bot is configured', () => {
    expect(venueShareTarget('4fcfde65-cd97-44a5-ad99-951c7add4b97', 'lapa_pets_bot')).toBe(
      'https://t.me/lapa_pets_bot?startapp=venue_4fcfde65-cd97-44a5-ad99-951c7add4b97',
    );
    expect(venueShareTarget('v1', null)).toMatch(/#\/venue\/v1$/);
  });

  it('builds a Telegram share link', () => {
    expect(telegramShareUrl('https://lapa.example/#/venue/v1', 'Vet')).toBe(
      'https://t.me/share/url?url=https%3A%2F%2Flapa.example%2F%23%2Fvenue%2Fv1&text=Vet',
    );
  });
});
