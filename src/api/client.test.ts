import { api } from './client';
import { isApiError } from './errors';

const jsonHeaders = { 'content-type': 'application/json' };

describe('api client', () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('prefixes requests with EXPO_PUBLIC_API_URL', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200, headers: jsonHeaders }));

    await api.get('health');

    const [input] = fetchMock.mock.calls[0];
    const url = input instanceof Request ? input.url : String(input);
    expect(url.startsWith(process.env.EXPO_PUBLIC_API_URL as string)).toBe(true);
  });

  it('normalizes HTTP errors into ApiError', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"bad"}', { status: 422, headers: jsonHeaders })
    );

    let caught: unknown;
    try {
      await api.get('things');
    } catch (error) {
      caught = error;
    }

    expect(isApiError(caught)).toBe(true);
    if (isApiError(caught)) {
      expect(caught.status).toBe(422);
      expect(caught.message).toBe('bad');
      expect(caught.details).toEqual({ message: 'bad' });
    }
  });
});
