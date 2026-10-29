const expoConfig = require('eslint-config-expo/flat');
const i18next = require('eslint-plugin-i18next');
const prettierConfig = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: ['node_modules/', 'ios/', 'android/', '.expo/', 'patches/', 'specs/', 'expo-env.d.ts'],
  },
  ...expoConfig,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,tsx}'] })),
  {
    // Every user-facing string must come from the translation resources (spec FR-008).
    ...i18next.configs['flat/recommended'],
    files: ['src/**/*.tsx'],
    rules: {
      'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }],
    },
  },
  prettierConfig,
];
