# Contract: package.json Scripts

Every script exits non-zero on failure. CI and the README rely on these names.

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `expo start --dev-client` | Metro for an installed development build |
| `ios` | `expo run:ios` | Prebuild if needed, build and launch on the iOS Simulator |
| `ios:device` | `expo run:ios --device` | Same, targeting a connected iPhone |
| `android` | `expo run:android` | Prebuild if needed, build and launch on an Android emulator |
| `prebuild` | `expo prebuild --clean` | Regenerate `ios/` and `android/` from config |
| `typecheck` | `tsc --noEmit` | Strict type check of the whole project |
| `lint` | `eslint .` | ESLint flat config, zero warnings tolerated (`--max-warnings 0`) |
| `format` | `prettier --write .` | Rewrite files to the Prettier style |
| `format:check` | `prettier --check .` | Verify formatting without writing (used by CI) |
| `test` | `jest` | Run the test suite once |
| `test:watch` | `jest --watch` | Interactive test runner |
| `eas:config` | `eas config --profile development --platform ios --non-interactive` | Validate EAS configuration (requires `eas login`) |
| `prepare` | `husky` | Install git hooks after `npm install` |
| `postinstall` | `patch-package` | Re-apply `patches/@nozbe+watermelondb+0.28.0.patch` to `node_modules` on every install (local and EAS) |

`lint-staged` configuration (in `package.json`):

```json
{
  "*.{ts,tsx,js,cjs,mjs}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"]
}
```

The pre-commit hook runs `npx lint-staged`. A failing lint rule aborts the commit; formatting is auto-applied.
