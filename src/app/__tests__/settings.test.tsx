import '@/i18n';

import { renderRouter, screen } from 'expo-router/testing-library';

import SettingsScreen from '../settings';

const mockLocalStorageGet = jest.fn();
const mockDatabase = { schema: { version: 1 }, localStorage: { get: mockLocalStorageGet } };

jest.mock('@nozbe/watermelondb/react', () => ({
  useDatabase: () => mockDatabase,
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('<SettingsScreen />', () => {
  beforeEach(() => {
    mockLocalStorageGet.mockReset();
  });

  it('reports the schema version once the database answers', async () => {
    mockLocalStorageGet.mockResolvedValue(null);

    await renderRouter({ settings: SettingsScreen }, { initialUrl: '/settings' });

    expect(await screen.findByText('Settings')).toBeTruthy();
    expect(await screen.findByText('Ready, schema version 1')).toBeTruthy();
  });

  it('shows a failure diagnostic instead of crashing', async () => {
    mockLocalStorageGet.mockRejectedValue(new Error('boom'));

    await renderRouter({ settings: SettingsScreen }, { initialUrl: '/settings' });

    expect(await screen.findByText('Failed to open: boom')).toBeTruthy();
  });
});
