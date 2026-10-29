# Contract: Environment and App Configuration

## Environment variables

| Variable | Scope | Example | Behaviour when missing |
|----------|-------|---------|------------------------|
| `EXPO_PUBLIC_API_URL` | client bundle (inlined) and `app.config.ts` | `http://localhost:3000` | `app.config.ts` warns: `EXPO_PUBLIC_API_URL is not set; copy .env.example to .env`. App launches; the HTTP client is created with `prefix: ''` and any request would fail with an `ApiError` of status 0. |
| `APPLE_TEAM_ID` | `app.config.ts` only (build time; sets `ios.appleTeamId`, hence `DEVELOPMENT_TEAM` in the generated Xcode project) | `P4Z3X5D83S` (each developer's own team) | Simulator builds are unaffected; device builds fail at signing with "requires a development team" until it is set. Never bundled into the app. |

Rules:
- Only `EXPO_PUBLIC_*` variables may be read in client code. `app.config.ts` may additionally read build-time variables such as `APPLE_TEAM_ID`; anything else is a secret and must not exist in this repository.
- Read with static dot-notation (`process.env.EXPO_PUBLIC_API_URL`), never computed keys.
- `.env` is gitignored. `.env.example` is committed and must list every variable the app reads.
- Tests set the variable in `jest.setup.ts`; they must not depend on a developer's `.env`.

## `app.config.ts` output (subset that other code relies on)

```ts
{
  name: 'Warehouse',
  slug: 'warehouse',
  scheme: 'warehouse',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.hp.warehouse.app', supportsTablet: false },
  android: { package: 'com.hp.warehouse.app' },
  plugins: [
    'expo-router',
    'expo-dev-client',
    'expo-secure-store',
    'expo-localization',
    '@morrowdigital/watermelondb-expo-plugin',
  ],
}
```

`newArchEnabled` is intentionally absent: the SDK 58 config type no longer accepts it because the New Architecture cannot be disabled. The HTTP client is created with `prefix: ''` when the variable is missing. Changing `slug` after the project is linked to EAS requires re-linking. Changing identifiers requires `npx expo prebuild --clean`.

## Git-ignored paths that the build regenerates

`ios/`, `android/`, `.expo/`, `node_modules/`, `.env`, `.env.*.local`, `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`.
