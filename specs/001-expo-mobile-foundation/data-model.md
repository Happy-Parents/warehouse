# Data Model: Expo Mobile Foundation

**Feature**: `001-expo-mobile-foundation` | **Date**: 2026-10-29

This phase has no business entities. The "data" is configuration and infrastructure state. Each entity below maps to one module in the source tree (see [plan.md](plan.md#source-code-repository-root)).

## Environment Configuration

Public, non-secret settings read at build and run time.

| Field | Type | Source | Required | Notes |
|-------|------|--------|----------|-------|
| `EXPO_PUBLIC_API_URL` | absolute URL string | `.env` (gitignored), documented in `.env.example` | yes for network use; app still launches without it | Inlined by Metro at build time. Read via static `process.env.EXPO_PUBLIC_API_URL` only. |

**Validation**: `app.config.ts` emits a `console.warn` naming the variable when it is undefined or empty. No throw (FR-011).

**Lifecycle**: loaded by Expo CLI before `app.config.ts` evaluation and again when Metro bundles; EAS Build uploads `.env` files and inlines identically.

## App Identity (in `app.config.ts`)

| Field | Value | Changeable |
|-------|-------|------------|
| `name` | `Warehouse` | yes |
| `slug` | `warehouse` | yes, before first EAS project link |
| `scheme` | `warehouse` | yes |
| `ios.bundleIdentifier` | `com.hp.warehouse.app` | yes, placeholder |
| `android.package` | `com.hp.warehouse.app` | yes, placeholder |
| `userInterfaceStyle` | `automatic` | no (required for system light/dark) |
| `newArchEnabled` | not set | the SDK 58 config type rejects the key; the New Architecture is always on |
| `plugins` | `expo-router`, `expo-dev-client`, `expo-secure-store`, `expo-localization`, `@morrowdigital/watermelondb-expo-plugin` | grows with features |

## Translation Resource

One JSON document per language, identical key structure.

```text
locales/
├── uk.json   # default language
└── en.json   # fallback language
```

**Namespace**: single default namespace `translation`.

**Keys in this phase**:

| Key | Used by |
|-----|---------|
| `home.title` | Home screen header and heading |
| `home.openSettings` | Home screen Button label |
| `settings.title` | Settings screen header and heading |
| `settings.databaseStatus` | Diagnostic label |
| `settings.databaseReady` | Interpolates `{{version}}` |
| `settings.databaseError` | Interpolates `{{message}}` |

**Validation rules**:
- Both files contain exactly the same key set (a unit test may assert this; optional).
- Type-level: `i18next.d.ts` declares `CustomTypeOptions.resources` from `en.json` so unknown keys fail `tsc`.
- Lint-level: `i18next/no-literal-string` rejects literal JSX text in `src/**/*.tsx`.

**Language resolution** (state machine, evaluated once at startup):

```text
getLocales()[0]?.languageCode
  ├─ 'uk'        → lng = 'uk'
  ├─ undefined   → lng = 'uk'   (locale undeterminable → project default)
  └─ anything else → lng = 'en'
fallbackLng = 'en' for individual missing keys
```

## Local Database

WatermelonDB instance wrapping one SQLite file on device.

| Property | Value |
|----------|-------|
| Adapter | `SQLiteAdapter` with `jsi: true` |
| Database name | `warehouse` (default file in app sandbox) |
| Schema version | `1` |
| Tables | none |
| Model classes | none |
| Migrations | none |
| Sync | none |

**Diagnostic state** (held in Settings screen component state, not persisted):

```text
idle → checking → ready { version: number }
                → failed { message: string }
```

`checking` performs `database.localStorage.get('smoke')` to force the adapter to initialize; the resolved value is ignored. `ready` shows `database.schema.version`. `failed` shows the caught error message. `onSetUpError` on the adapter logs the same error at startup.

## Secure Storage Entry

Key-value pairs in the platform keychain / keystore via expo-secure-store.

| Field | Type | Constraint |
|-------|------|------------|
| key | `SecureKey` (string-literal union) | alphanumeric, `.`, `-`, `_` only (SecureStore rule) |
| value | `string` | under 2048 bytes (SecureStore guidance) |

**Keys in this phase**: none written by the app. The union contains a single placeholder member so the type compiles; the auth feature adds `accessToken` and `refreshToken`.

**Operations**: `get(key) → string | null`, `set(key, value) → void`, `remove(key) → void`. `get` never throws for an absent key.

## API Error

Normalized error produced by the HTTP client's `beforeError` hook.

| Field | Type | Source |
|-------|------|--------|
| `status` | `number` | HTTP response status, `0` when no response (network failure) |
| `message` | `string` | `body.error` or `body.message` when the body is JSON, else HTTP status text |
| `details` | `unknown` (optional) | the parsed JSON body when present, for callers that need field errors |

`ApiError extends Error`, `name === 'ApiError'`. Non-HTTP errors (timeouts, aborts) are left untouched by the normalizer in this phase.

## Build Profile

Entries in `eas.json`.

| Profile | `developmentClient` | `distribution` | Extra |
|---------|---------------------|----------------|-------|
| `development` | `true` | `internal` | `ios.simulator` not set (device builds); add `development-simulator` later if wanted |
| `preview` | `false` | `internal` | – |
| `production` | `false` | `store` (default) | `autoIncrement: true` |

`cli.version` pins `>= 27.0.0`. `cli.appVersionSource` is `remote`.

## Relationships

```text
app.config.ts ──reads──▶ Environment Configuration
root layout   ──mounts─▶ DatabaseProvider(Local Database)
              ──mounts─▶ I18nextProvider(Translation Resource via language resolution)
              ──mounts─▶ ThemeProvider(NAV_THEME[colorScheme])
Settings      ──queries▶ Local Database (diagnostic)
api/client    ──reads──▶ Environment Configuration ──throws──▶ API Error
storage       ──wraps──▶ Secure Storage Entry
eas.json      ──defines▶ Build Profile ×3
```
