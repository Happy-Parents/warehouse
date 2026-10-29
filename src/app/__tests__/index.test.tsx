import '@/i18n';

import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import HomeScreen from '../index';

const SettingsStub = () => null;

describe('<HomeScreen />', () => {
  it('renders the translated title and the settings button', async () => {
    await renderRouter({ index: HomeScreen, settings: SettingsStub }, { initialUrl: '/' });

    expect(await screen.findByText('Warehouse')).toBeTruthy();
    expect(screen.getByText('Open settings')).toBeTruthy();
  });

  it('navigates to settings when the button is pressed', async () => {
    const result = await renderRouter(
      { index: HomeScreen, settings: SettingsStub },
      { initialUrl: '/' }
    );

    fireEvent.press(await screen.findByText('Open settings'));

    await waitFor(() => expect(result.getPathname()).toBe('/settings'));
  });
});
