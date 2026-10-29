# Warehouse mobile client

Cross-platform mobile client for the inventory back office, built with Expo SDK 58 and React Native 0.88. This repository currently holds the application foundation only: two placeholder screens that prove navigation, localization, styling, local database startup, environment configuration and the quality gates. Business features (sign-in, inventory, offline sync, QR scanning) are added on top of it.

## Prerequisites

| Tool      | Version                                     | Notes                                                            |
| --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Node.js   | 22.13+ or 24.3+ (LTS, even majors only)     | `node -v`                                                        |
| npm       | 10+                                         | ships with Node                                                  |
| Xcode     | 16+ with an iOS Simulator runtime installed | `xcodebuild -version`                                            |
| CocoaPods | 1.16+                                       | `pod --version`; see Troubleshooting if `pod install` fails      |
| Bundler   | any 2.x                                     | `gem install bundler` if missing; used to pin the CocoaPods gems |
| Watchman  | any current                                 | `brew install watchman`                                          |
| EAS CLI   | 27+                                         | `npm install -g eas-cli`, only needed for cloud builds           |

Android only:

| Tool           | Notes                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| JDK 17 or 21   | Android Studio bundles one: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"` |
| Android Studio | with the Android SDK (API 36), platform tools and one emulator (AVD)                                         |
| `ANDROID_HOME` | usually `$HOME/Library/Android/sdk`                                                                          |

## Setup

```sh
git clone <repository-url> warehouse
cd warehouse
cp .env.example .env        # fill in EXPO_PUBLIC_API_URL for your environment
npm install                 # also applies patches/ (see Native projects)
```

The `postinstall` script applies `patches/@nozbe+watermelondb+0.28.0.patch` to `node_modules`. If the install log does not show `patch-package` applying it, stop and fix that before building.

## Run on the iOS Simulator

```sh
npm run ios
```

This generates the native project (`ios/`), installs CocoaPods, builds the app, launches it on the default simulator and starts Metro. The Home screen shows the app title in the device language and an "Open settings" button. Tap the button to reach Settings, which reports whether the local database opened and its schema version.

To pick a simulator: `npm run ios -- --device "iPhone 17"`.

## Run on a physical iPhone

Local route (no Expo account needed):

1. **Xcode must support the phone's iOS version.** Xcode only deploys to iOS versions it ships a developer disk image for (Xcode 26.x: up to iOS 26; Xcode 27: iOS 27). Check with `xcrun devicectl list devices`: a phone showing `connected (no DDI)` needs a newer Xcode.
2. **Sign in to your Apple ID in Xcode** (Xcode > Settings > Accounts > "+"). A free Apple ID is enough for on-device development; its certificates last 7 days and are renewed automatically on each build.
3. **Put your Team ID in `.env`**: `APPLE_TEAM_ID=XXXXXXXXXX` (Xcode > Settings > Accounts > select the team; the ID is shown next to its name). `app.config.ts` passes it to the generated Xcode project as `DEVELOPMENT_TEAM` with automatic signing, so nothing is edited under `ios/`. Run `npm run prebuild` (or `npx expo prebuild --clean --no-install` plus `npm run ios:pods` on machines with the CocoaPods issue below) after changing it.
4. On the iPhone, enable **Developer Mode** (Settings > Privacy & Security > Developer Mode), connect it by cable and tap **Trust** on the phone.
5. **First time only, create the signing profile in Xcode**: open `ios/Warehouse.xcworkspace`, select the Warehouse target > Signing & Capabilities, and pick your team. Xcode registers the phone, issues the certificate and creates the profile for `com.hp.warehouse.app`. Expo CLI cannot do this step itself because it runs `xcodebuild` without `-allowProvisioningUpdates`, so `npm run ios:device` fails with "No profiles for 'com.hp.warehouse.app' were found" until the profile exists.
6. `npm run ios:device` and pick the phone (Expo lists phones by name or hardware UDID from `xcrun xctrace list devices`).
7. On the phone, trust the developer certificate under Settings > General > VPN & Device Management (the first launch is refused until you do).
8. `npm start` runs Metro. The development build connects to it and reloads on every save.

EAS route (cloud build, needs `eas login` and a linked project):

```sh
eas init                                     # once per project, links it to your Expo account
eas build --profile development --platform ios
```

Install the build from the link EAS prints, then `npm start` and open the app.

### Validate EAS configuration

```sh
npm run eas:config
```

Prints the resolved `development` profile for iOS and fails on invalid configuration. Requires `eas login` and `eas init`.

## Run on Android

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
npm run android              # or: npm run android -- --device Pixel_9
```

Start an emulator first (or let Expo start the one you name). The same Home and Settings screens appear.

## Light and dark mode

Appearance follows the system. NativeWind switches the `dark:` styles and `src/lib/theme.ts` feeds matching colours to the navigation header. Toggle the simulator appearance (Features > Toggle Appearance) to see both screens restyle without a restart.

## Localization

Ukrainian is the default language and English the fallback. The device language is read once at launch: a Ukrainian device shows Ukrainian, any other language shows English, and an undeterminable locale shows Ukrainian. All user-facing strings live in `src/i18n/locales/uk.json` and `en.json`; both files must contain the same keys (a unit test checks this). The ESLint rule `i18next/no-literal-string` rejects literal text inside JSX in `src/**/*.tsx`, so always go through `useTranslation()`.

## Tests, lint and formatting

```sh
npm run typecheck      # tsc --noEmit (strict)
npm run lint           # eslint, zero warnings allowed
npm run format:check   # prettier --check
npm run format         # prettier --write
npm test               # jest (jest-expo preset + React Native Testing Library)
npm run test:watch
```

A pre-commit hook (husky + lint-staged) runs ESLint with autofix and Prettier on staged files; a lint error aborts the commit.

## Scripts

| Script                                                              | Purpose                                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `start`                                                             | Metro for an installed development build                                         |
| `ios` / `ios:device`                                                | Build and run on the iOS Simulator / a connected iPhone                          |
| `android`                                                           | Build and run on an Android emulator                                             |
| `prebuild`                                                          | Regenerate `ios/` and `android/` from `app.config.ts`                            |
| `ios:pods`                                                          | `bundle exec pod install` for the generated `ios/` project (see Troubleshooting) |
| `typecheck`, `lint`, `format`, `format:check`, `test`, `test:watch` | Quality gates                                                                    |
| `eas:config`                                                        | Validate the EAS development profile                                             |
| `postinstall`                                                       | Applies `patches/` (patch-package)                                               |
| `prepare`                                                           | Installs git hooks (husky)                                                       |

## Environment variables

Only variables prefixed `EXPO_PUBLIC_` reach the app, and Metro inlines them at build time, so read them with static dot notation (`process.env.EXPO_PUBLIC_API_URL`). `.env` is gitignored; `.env.example` is committed and lists every variable the app reads. When `EXPO_PUBLIC_API_URL` is missing, `app.config.ts` prints a warning and the app still launches (no network calls happen in this phase). Never put secrets in the repository.

| Variable              | Example                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000`                                                             |
| `APPLE_TEAM_ID`       | `XXXXXXXXXX` (build-time only, read by `app.config.ts`; never bundled into the app) |

## Native projects

`ios/` and `android/` are generated by `npx expo prebuild` from `app.config.ts` and the config plugins listed there; both folders are gitignored. Never edit generated files. After changing `app.config.ts`, a config plugin, or `patches/`, run `npm run prebuild` (it deletes and regenerates both folders).

WatermelonDB 0.28.0 needs a four-hunk source patch to compile against React Native 0.88 (`patches/@nozbe+watermelondb+0.28.0.patch`; background in `specs/001-expo-mobile-foundation/research.md`, section R-01). `patch-package` applies it on every `npm install`, locally and on EAS.

## Folder structure

```text
.
├── app.config.ts            # Expo config: identity, plugins, env warning
├── babel.config.js          # babel-preset-expo (nativewind JSX, legacy decorators) + nativewind/babel
├── metro.config.js          # NativeWind CSS input
├── tailwind.config.js       # NativeWind preset, colour tokens, dark mode
├── global.css               # Tailwind directives and the light/dark CSS variables
├── components.json          # react-native-reusables CLI config
├── eas.json                 # development / preview / production build profiles
├── patches/                 # patch-package patches applied on install
├── src/
│   ├── app/                 # Expo Router routes (file-based): _layout.tsx, index.tsx, settings.tsx
│   ├── components/ui/       # Shared UI from react-native-reusables (button, text)
│   ├── db/                  # WatermelonDB schema and database instance
│   ├── api/                 # ky HTTP client and ApiError normalizer
│   ├── storage/             # Typed wrapper over expo-secure-store
│   ├── i18n/                # i18next setup and locales/{uk,en}.json
│   └── lib/                 # cn() helper and navigation theme
└── specs/                   # Feature specifications, plans and task lists
```

Reserved for upcoming features (create when first needed):

- `src/features/<feature>/` for screens, hooks and components owned by one feature
- `src/state/` for Zustand stores
- `src/db/models/` and `src/db/migrations.ts` for WatermelonDB models and migrations

## Contributing

- Keep route files in `src/app/` thin: they render a screen component and declare navigation options.
- Put feature code under `src/features/<name>/`; share only what two or more features need, in `src/components/ui/` or `src/lib/`.
- Shared state goes in `src/state/` as Zustand stores; forms use react-hook-form with zod schemas.
- Tables and models go in `src/db/` (bump `schema.version`, add a migration, register the model class).
- Every user-facing string goes in `src/i18n/locales/uk.json` and `en.json`.
- Tests sit next to the module they cover as `*.test.ts(x)`.
- Run `npm run typecheck && npm run lint && npm test` before pushing. The pre-commit hook formats and lints staged files.

## Troubleshooting

**`pod install` fails with `ArgumentError - unknown keyword: quirks_mode`.** Your Ruby has the `json` 3.x gem active, which breaks ActiveSupport 7.2's JSON encoding used by Expo's autolinking scripts. The repository ships a `Gemfile` that pins compatible gems. Either run CocoaPods through Bundler and skip Expo's own pod step:

```sh
bundle install
npx expo prebuild --clean --no-install
npm run ios:pods
npx expo run:ios --no-install
```

or remove the newer gem from your Ruby (`gem uninstall json -v 3.1.0`) so that `npm run ios` works directly. Expo CLI does not run CocoaPods through Bundler on its own.

**`pod install` fails with "multiple dependencies with different sources for `simdjson`".** Known with the WatermelonDB config plugin on some setups. Add a `react-native.config.js` that disables iOS autolinking for `@nozbe/simdjson`:

```js
module.exports = { dependencies: { '@nozbe/simdjson': { platforms: { ios: null } } } };
```

**Settings shows "Failed to open" or Metro logs `NativeModules.WMDatabaseBridge is not defined`.** The native WatermelonDB module is missing from the build: check that `patches/` was applied (`grep -c RCTCxxBridge node_modules/@nozbe/watermelondb/native/ios/WatermelonDB/JSIInstaller.h` must print `0`), that `@morrowdigital/watermelondb-expo-plugin` is in `app.config.ts`, then `npm run prebuild` and rebuild.

**Android build cannot find Java.** Export `JAVA_HOME` as shown under Prerequisites; a system-wide JDK is not required.
