const preset = require('jest-expo/jest-preset');

// ESM-only or untransformed packages that Jest must run through Babel in addition to the preset list.
const extraTransformed = ['ky', 'nativewind', '@rn-primitives'];

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
    pattern.replace(
      '|standard-navigation))',
      `|standard-navigation|${extraTransformed.join('|')}))`
    )
  ),
};
