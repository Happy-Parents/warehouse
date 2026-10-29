import { secureStorage } from './secureStorage';

describe('secureStorage', () => {
  it('round-trips a value', async () => {
    await secureStorage.set('smoke', '1');
    await expect(secureStorage.get('smoke')).resolves.toBe('1');
  });

  it('returns null after remove', async () => {
    await secureStorage.set('smoke', '1');
    await secureStorage.remove('smoke');
    await expect(secureStorage.get('smoke')).resolves.toBeNull();
  });
});
