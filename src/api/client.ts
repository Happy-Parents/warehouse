import ky from 'ky';

import { normalizeError } from './errors';

export const api = ky.create({
  prefix: process.env.EXPO_PUBLIC_API_URL ?? '',
  hooks: {
    beforeError: [normalizeError],
  },
});
