import { resolveLanguage } from './index';
import en from './locales/en.json';
import uk from './locales/uk.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('resolveLanguage', () => {
  it('uses Ukrainian for a Ukrainian device', () => {
    expect(resolveLanguage('uk')).toBe('uk');
  });

  it('uses Ukrainian when the locale cannot be determined', () => {
    expect(resolveLanguage(undefined)).toBe('uk');
  });

  it('uses English for every other language', () => {
    expect(resolveLanguage('en')).toBe('en');
    expect(resolveLanguage('de')).toBe('en');
  });
});

describe('translation resources', () => {
  it('have identical key sets in uk and en', () => {
    expect(flattenKeys(uk).sort()).toEqual(flattenKeys(en).sort());
  });
});
