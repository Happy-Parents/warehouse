import * as SecureStore from 'expo-secure-store';

/** Keys allowed in secure storage. Features extend this union (e.g. 'accessToken'). */
export type SecureKey = 'smoke';

// SecureStore constraints: keys use alphanumeric, '.', '-' and '_' only; values stay under 2048 bytes.
export const secureStorage = {
  async get(key: SecureKey): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: SecureKey, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: SecureKey): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
