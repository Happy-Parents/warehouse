# Research: Expo Mobile Foundation

**Feature**: `001-expo-mobile-foundation` | **Date**: 2026-10-29 (revised same day after native build verification)

All versions were read from the npm registry and upstream repositories on 2026-10-29. Pin them at implementation time with `npx expo install` so Expo resolves the SDK-compatible range.

**Legend used throughout**: **[VERIFIED]** = reproduced on this machine or read directly from package sources on 2026-10-29. **[REPORTED]** = stated by a third party (issue tracker, README) and not reproduced here. **[ASSUMPTION]** = a reasonable default chosen by this plan, not checked.

## R-01 Expo SDK version (DECISION: SDK 58 with a four-hunk WatermelonDB patch)

**Decision**: Pin **Expo SDK 58** (`expo@~58.0.21`, React Native 0.88.1, React 19.3.0) and carry a small source patch for `@nozbe/watermelondb@0.28.0` via `patch-package`. This supersedes the earlier draft of this document, which pinned SDK 57 before the patch had been exercised.

**The conflict, [VERIFIED]**: the brief mandates both "latest stable Expo SDK" and WatermelonDB with JSI. WatermelonDB 0.28.0 (the latest release; `0.28.1-0` on the `next` tag has identical native sources) does not compile against React Native 0.88:

| Platform | Cause | Evidence |
|----------|-------|----------|
| iOS | RN 0.88 removed the `RCTCxxBridge` class (`React/CxxBridge/RCTCxxBridge.mm` and the `@interface RCTCxxBridge : RCTBridge` declaration are gone; only the `RCTBridge (RCTCxxBridge)` category remains). WatermelonDB types its JSI installer's bridge as `RCTCxxBridge *` in `JSIInstaller.h`, `JSIInstaller.mm` and `WMDatabaseBridge.m`. | Package sources of `react-native@0.86.3` vs `0.88.1` and `@nozbe/watermelondb@0.28.0`; reproduced: `xcodebuild` of the `WatermelonDB` pod fails on SDK 58 with `unknown type name 'RCTCxxBridge'` (4 errors) and succeeds on SDK 57. |
| Android | WatermelonDB's Java reads `BuildConfig.DEBUG` but its `build.gradle` never enables `buildFeatures.buildConfig`. Up to RN 0.86 the React Native Gradle plugin forced `buildConfig = true` on **every** library subproject (`configureBuildConfigFieldsForLibraries` iterated `rootProject.allprojects`); from RN 0.87 it only configures the project that applies the React plugin. AGP 9 (RN 0.87+) also removed the global `android.defaults.buildfeatures.buildconfig` property. | `@react-native/gradle-plugin` sources 0.86.3 vs 0.87.0/0.88.1; AGP 9.0 release notes; reproduced: `:nozbe_watermelondb:compileDebugJavaWithJavac` fails on SDK 58 with `cannot find symbol` at `WMDatabaseBridge.java:257,276` and `WMDatabaseDriver.java:63`, succeeds on SDK 57. |

**The patch, [VERIFIED]**: four hunks, taken from Nozbe/WatermelonDB issue #1969 (comments of 2026-10-19 and 2026-10-22), reproduced here:

1. `native/ios/WatermelonDB/JSIInstaller.h`: declare a category `RCTBridge (WMJSIRuntime)` exposing `- (void *)runtime;` and change the installer signature to `RCTBridge *`.
2. `native/ios/WatermelonDB/JSIInstaller.mm`: same signature change.
3. `native/ios/WatermelonDB/objc/WMDatabaseBridge.m`: cast `_bridge` to `RCTBridge *` instead of `RCTCxxBridge *`.
4. `native/android/build.gradle`: add `buildFeatures { buildConfig true }` inside `android {}`.

Why it is sound: under the New Architecture a legacy module's `_bridge` is an `RCTBridgeProxy`, which implements `- (void *)runtime` (`RCTBridgeProxy.mm` line 99 in 0.88.1). The category only makes that selector visible to the compiler.

**Verification matrix (this machine, 2026-10-29)**: Xcode 26.6, CocoaPods 1.17.0, Node 24.18, Android Studio JBR 21, NDK 27.1, iOS 26.2 simulators.

| Check | SDK 57 unpatched | SDK 58 unpatched | SDK 58 patched |
|-------|------------------|------------------|----------------|
| `npx expo prebuild` + `pod install` (with the WatermelonDB plugin) | pass | pass | pass |
| iOS: `WatermelonDB` pod compiles (Debug, simulator) | pass | **fail** (RCTCxxBridge ×4) | pass |
| iOS: Release app on simulator, `SQLiteAdapter({ jsi: true })`, `_dispatcherType === 'jsi'`, `localStorage` set/get round trip, schema v1 | pass (RN 0.86.3, fabric=true, bridgeless=true) | not applicable | pass (RN 0.88.1, fabric=true, bridgeless=true) |
| Android: `:nozbe_watermelondb` Java + Kotlin compile | pass | **fail** (BuildConfig ×3) | pass |
| Android: `:watermelondb-jsi` CMake build (4 ABIs) + Java compile | pass | pass | pass |
| Android: app runtime on emulator | not run | not applicable | **pass** (implementation, 2026-10-29: Pixel_9 API 36 emulator, debug build; Home, Settings "Ready, schema version 1", dark mode, back navigation; logcat "Successfully installed Watermelon DB JSI Bindings") |
| Android: R8 release build runtime | not run | not applicable | **pass** (implementation, 2026-10-29: `:app:assembleRelease` with `minifyReleaseWithR8`, installed on the emulator, Settings reports schema version 1; the plugin's ProGuard keep rule is sufficient) |
| iOS: app runtime, iPhone 17 simulator (debug dev client) | not run | not applicable | **pass** (implementation, 2026-10-29: Home, Settings "Ready, schema version 1", Ukrainian via `-AppleLanguages (uk)`, dark/light appearance, native back button) |
| Clean regeneration (`rm -rf ios android`, prebuild, pods, rebuild) | not run | not applicable | **pass** (implementation, 2026-10-29: patch intact in `node_modules`, plugin injections regenerated, iOS build succeeded and app launched) |
| Physical iPhone | not run | not run | **pass** (2026-10-29: iPhone 15 on iOS 27.0.1, Xcode 26.6 debug build signed with the personal team via `APPLE_TEAM_ID`, installed with `devicectl`, launched against Metro over Wi-Fi; Metro log shows the bundle served and WatermelonDB schema v1 set up on the device) |
| EAS `eas config` validation | not run | not run | **blocked**: the machine is logged in, but the project is not linked (`eas init` would create a project in the owner's Expo account, left for the owner) |

The JSI runtime result on SDK 58 closes the gap the patch author explicitly flagged as untested. During implementation the SDK 58 column was extended with emulator and release-build runs (rows above); only the physical iPhone and EAS project validation remain open.

**Rationale for SDK 58 over SDK 57**:

- Both mandates are honoured (latest SDK; WatermelonDB on JSI) with a patch whose every hunk has been compiled on both platforms and exercised at runtime on iOS.
- SDK 57 only defers the patch. WatermelonDB upstream is dormant (see risk below), so the next SDK upgrade would require the same four hunks anyway, with the foundation then also carrying an SDK migration.
- SDK 58 was released 2026-10-15 and SDK 57 on 2026-06-30; Expo's stated lifetime is "approximately one year", so SDK 58 buys about four more months of support.
- Cost: one dev dependency (`patch-package@^8`, npm has no native patch support), one `patches/` file, a `postinstall` script, and a README note. **[ASSUMPTION]**: `patch-package` runs during EAS Build's `npm install` lifecycle as on any npm install; this is the documented pattern but was not exercised on EAS here.

**Fallback**: if team policy forbids patching third-party native code, SDK 57 (`expo@~57.0.31`, RN 0.86.3) is the newest SDK where WatermelonDB builds unpatched, verified identically above. Switching is a version change in `package.json`, removal of the patch, and the SDK-57 variants of the versions listed in R-02 to R-10.

**Alternatives considered**:

- *NitromelonDB* (`nitromelondb@0.31.1`, 2026-10-12): a maintained TypeScript/Nitro-Modules fork with a WatermelonDB-compatible API, its own Expo config plugin, a migration guide (same SQLite files, schema and models; `jsi` option removed), CI on real devices, and examples already on Expo SDK 58 / RN 0.88 (its issue #173, closed 2026-10-23). Young: first release 2026-08-16, 19 releases since, 35 stars, 13 open issues, effectively one active maintainer [VERIFIED from GitHub API]. Rejected because the brief names WatermelonDB; recorded as the most credible exit if upstream stays silent.
- *Disable the New Architecture*: impossible; SDK 55+ cannot disable it and RN 0.82 removed the option [VERIFIED, Expo docs].
- *Wait for an upstream release*: no PR fixing RN 0.88 exists; open PRs from 2026 (#1974 AGP 9 Kotlin, #1977, #1970, #1968) are unreviewed; last upstream commit 2025-08-11; no maintainer reply in #1969 [VERIFIED].

**Maintenance risk to record**: WatermelonDB is effectively unmaintained. The foundation isolates it behind `src/db/` so a swap to NitromelonDB or an upstream release touches one folder plus the patch file. Second risk: AGP 10 removes the `android.builtInKotlin=false` opt-out that Expo SDK 58 currently writes to `gradle.properties` (Gradle already prints a deprecation warning [VERIFIED]); WatermelonDB's unconditional `apply plugin: 'kotlin-android'` will then collide (upstream PR #1974 proposes the fix). That lands with a future SDK, not this one.

## R-02 New Architecture

**Decision**: Nothing to configure. The New Architecture is mandatory on SDK 55+. [VERIFIED during implementation] the SDK 58 `ExpoConfig` type no longer has a `newArchEnabled` key (`tsc` rejects it), so `app.config.ts` omits it; prebuild still writes `newArchEnabled=true` to `android/gradle.properties`. The probe apps reported `fabric=true bridgeless=true` on both SDKs.

## R-03 WatermelonDB integration

**Decision**: `@nozbe/watermelondb@0.28.0` (patched per R-01) with `@morrowdigital/watermelondb-expo-plugin@2.4.0-beta.0` (npm tag `beta`), JSI enabled.

**Rationale**:
- Plugin `2.3.3` (npm `latest`, May 2024) injects the pre-0.28 Android JSI hook (`getJSIModulePackage`), which fails to compile on current Expo templates (plugin issue #60) [REPORTED]. `2.4.0-beta.0` (Nov 2025; source tagged 2.4.0 in Jan 2026, never published as stable) injects the 0.28 method. [VERIFIED] on both SDKs it wrote: `include ':watermelondb-jsi'` in `settings.gradle`, `implementation project(':watermelondb-jsi')` in `app/build.gradle`, `add(WatermelonDBJSIPackage())` in `MainApplication.kt`, and `-keep class com.nozbe.watermelondb.** { *; }` in `proguard-rules.pro`. iOS is left to autolinking.
- A community fork, `@imaceobtch/watermelondb-expo-plugin@2.4.0` (2026-09-23), publishes the same source as a stable release and states testing on SDK 54 to 57 [REPORTED]. Not adopted because the brief names the Morrow plugin; it is a drop-in if the beta tag becomes a concern.
- Adapter: `SQLiteAdapter({ schema, jsi: true, onSetUpError })`. `jsi: true` activates JSI on both platforms.
- Schema: `appSchema({ version: 1, tables: [] })`. No models, no migrations, no sync.
- Provider: `DatabaseProvider` from `@nozbe/watermelondb/react` in the root layout.
- Smoke check: the Settings screen reads `database.schema.version` and performs one round trip through the adapter (`database.localStorage.get`) so that a failed native setup surfaces as a diagnostic, not a crash. [VERIFIED] this exact round trip is what the probe app exercised.
- Babel: `babel-preset-expo` bundles `@babel/plugin-proposal-decorators` behind the `decorators: { legacy: true }` preset option [VERIFIED in `babel-preset-expo` type definitions]. Configure it now (one line); every future WatermelonDB model requires it.
- Android release builds: SDK 58 enables R8 by default [REPORTED, SDK 58 changelog]; the plugin's ProGuard keep rule is therefore required and present. **[ASSUMPTION]** no further keep rules are needed; confirm with one Android release build during implementation.

**simdjson contingency, downgraded**: plugin issue #53 reports a `pod install` failure on Expo 54+ ("multiple dependencies with different sources for `simdjson`"). [VERIFIED] it did **not** occur on this machine on SDK 57 or 58 with CocoaPods 1.17.0; `Podfile.lock` resolved `simdjson (3.9.4)` once from `../node_modules/@nozbe/simdjson`. Keep the `react-native.config.js` workaround in the back pocket; do not add it pre-emptively.

## R-04 Navigation

**Decision**: `expo-router@~58.0.28` with the `Stack` layout. Routes live under `src/app/`, which Expo Router discovers automatically.

**Rationale**: `Stack` wraps the native stack (react-native-screens) on iOS. Three route files: `_layout.tsx` (providers + `<Stack />`), `index.tsx` (Home), `settings.tsx` (Settings). Titles come from `Stack.Screen options` fed by translated strings. SDK 58 notes [REPORTED, changelog]: the navigation core was redesigned and "some APIs moved or removed"; `web.output` now defaults to `server`. Neither affects a two-screen native stack; web is not a target, so no `react-native-web` is installed. Verify `Stack` and `Link` imports against the SDK 58 docs during implementation.

## R-05 HTTP client

**Decision**: `ky@^2.2` via `ky.create({ prefix: process.env.EXPO_PUBLIC_API_URL, hooks: { beforeError } })`. [VERIFIED during implementation] ky 2 renamed `prefixUrl` to `prefix`, and `beforeError` receives `{ error, request, options }` with the response body pre-parsed into `error.data` (the stream is consumed), so the normalizer reads `error.data` instead of the body.

**Rationale**: `beforeError` turns an `HTTPError` into a normalized `ApiError { status, message, details? }`. ky 2 is ESM-only and requires Node 22+ [VERIFIED, package metadata]; local Node is 24.18. Jest must transform it: add `ky` to `transformIgnorePatterns` on top of the `jest-expo` default.

**Test strategy**: mock global `fetch`, call the client once, assert the requested URL starts with the configured prefix.

## R-06 Secure storage

**Decision**: `expo-secure-store@~58.0.2` wrapped in `src/storage/secureStorage.ts` exposing `get`, `set`, `remove` over a `SecureKey` string-literal union.

**Rationale**: thin wrapper keeps typed keys in one place; `remove` instead of `delete` because `delete` is a reserved word. `get` returns `string | null`, never throws for a missing key. Unit test mocks the module with an in-memory map.

## R-07 Localization

**Decision**: `i18next@^26` + `react-i18next@^17` + `expo-localization@~58.0.5`.

- Language detection: `getLocales()[0]?.languageCode`. `'uk'` → `uk`; any other code → `en`; no locale → `uk`.
- `fallbackLng: 'en'` so a missing Ukrainian key shows English rather than the key.
- Resources: `src/i18n/locales/uk.json` and `en.json`, typed via `i18next` `CustomTypeOptions`.
- Hard-coded string enforcement: `eslint-plugin-i18next@^6` rule `i18next/no-literal-string` (flat config export `configs['flat/recommended']` [VERIFIED, README]), scoped to `src/**/*.tsx`.
- Language change at runtime is read on next launch only.

## R-08 Styling and components

**Decision**: `nativewind@4.2.7` with `tailwindcss@^3.4.19` (npm tag `v3-lts`), plus react-native-reusables `Button` and `Text` added via `npx @react-native-reusables/cli@latest add button` after the manual project setup.

**Rationale** [VERIFIED from NativeWind docs and the reusables docs source]:
- NativeWind 4 requires Tailwind 3; NativeWind 5 (Tailwind 4) is a release candidate (`5.0.0-rc.0`, 2026-09-13). Tailwind's `latest` is 4.x, so pin `^3.4.19` explicitly.
- Reusables' manual setup for an existing project: NativeWind install; `metro.config.js` with `withNativeWind(config, { input: './global.css', inlineRem: 16 })`; `global.css` with the CSS-variable palette (light under `:root`, dark under `.dark:root`); `tailwind.config.js` with `darkMode: 'class'`, the NativeWind preset, HSL colour tokens and `tailwindcss-animate`; `lib/theme.ts` with `NAV_THEME` for `ThemeProvider` from `expo-router/react-navigation`; `lib/utils.ts` with `cn`; `components.json` with aliases at `@/components`, `@/lib`.
- `add button` (shadcn CLI underneath) installs `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/slot` and writes `button.tsx` and `text.tsx`.
- Dark mode: NativeWind's colour scheme follows the system unless `setColorScheme` is called; `userInterfaceStyle: 'automatic'` in app config.
- The SDK 58 template already ships `react-native-reanimated@4.7.1` and `react-native-worklets@0.13.0`, which NativeWind requires.
- `PortalHost` is skipped: only overlay components need it. Prettier: `prettier-plugin-tailwindcss@^0.8`.

## R-09 Testing

**Decision**: `jest-expo@~58.0.13` preset with **Jest 30** (required for SDK 58 [VERIFIED, Expo unit-testing docs and `jest-expo` peer range `^29 || ^30`]), `@testing-library/react-native@^14` (Expo Router tests need 14+), tests colocated as `*.test.ts(x)` under `src/`.

- `renderRouter` from `expo-router/testing-library` renders Home with a working router context.
- Settings test mocks `@/db/database` with a fake exposing `schema.version = 1` and `localStorage.get`.
- `jest.setup.ts` sets `process.env.EXPO_PUBLIC_API_URL` and mocks `expo-secure-store` and `expo-localization`.
- `moduleNameMapper` maps `^@/(.*)$` to `<rootDir>/src/$1`.

## R-10 Lint, format, hooks

**Decision**: ESLint 9 flat config (`eslint-config-expo@~58.0.4` via `eslint-config-expo/flat`, `typescript-eslint` recommended, `eslint-plugin-i18next`, `eslint-config-prettier` last), Prettier 3, `husky@^9` + `lint-staged@^17`, `patch-package@^8` with a `postinstall` script.

**Rationale**: `eslint-config-expo` is tested against ESLint 9; `typescript-eslint` 8.x accepts ESLint 9 and 10 [VERIFIED, peer ranges]. `typescript@~6.0.3` and `@types/react@~19.3.0` are what the SDK 58 template ships; TypeScript 7 is excluded by `@typescript-eslint/parser`'s `<6.1.0` peer range.

## R-11 Path aliases

**Decision**: `tsconfig.json` `paths: { "@/*": ["./src/*"] }`. No Babel alias plugin.

**Rationale** [VERIFIED, Expo TypeScript guide]: Expo CLI's Metro integration honours `tsconfig.json` paths by default, so `babel-plugin-module-resolver` would be a redundant second source of truth. Jest gets `moduleNameMapper`. Recorded in the plan as a deliberate deviation from the brief's "TypeScript and Babel" wording.

## R-12 Environment variables

**Decision**: `.env.example` with `EXPO_PUBLIC_API_URL=http://localhost:3000`; `.env` gitignored.

- Expo CLI loads `.env` files before evaluating `app.config.ts`, so `app.config.ts` reads `process.env.EXPO_PUBLIC_API_URL` and prints a `console.warn` when it is missing (FR-011). The HTTP client reads the same variable directly; Metro inlines it at build time; static dot-notation access is required [VERIFIED, Expo env docs].
- SDK 58 changed `NODE_ENV` handling [REPORTED, changelog]; only `EXPO_PUBLIC_*` is used here, so no impact expected.

## R-13 Native projects and prebuild

**Decision**: Continuous Native Generation. `ios/` and `android/` are gitignored; `npx expo prebuild --clean` regenerates them from `app.config.ts` and config plugins. [VERIFIED] prebuild of an SDK 58 project with the WatermelonDB plugin succeeds for both platforms and generates the SDK 58 `SceneDelegate.swift`-based iOS project without manual steps. The WatermelonDB patch lives in `patches/`, applied to `node_modules` by `postinstall`, so regeneration stays reproducible.

## R-14 EAS

**Decision**: `eas.json` with `cli.version >= 27`, profiles `development` (`developmentClient: true`, `distribution: internal`), `preview` (`distribution: internal`), `production` (`autoIncrement: true`).

**Validation**: `eas config --profile development --platform ios --non-interactive` resolves and prints the merged configuration [VERIFIED, eas-cli README]. `eas build --local` additionally needs fastlane and an Expo login. EAS CLI (27.1.0) is not installed on the development machine.

## R-15 Physical iPhone path

**Decision**: README documents `npx expo run:ios --device` as the primary route and an EAS cloud development build as the alternative. **Not verified** here; no device was attached.

## R-16 Android toolchain

**Decision**: README lists JDK 17 or 21 and Android Studio with an emulator as Android prerequisites. [VERIFIED] the machine has no system Java but Android Studio's bundled JBR 21 at `/Applications/Android Studio.app/Contents/jbr/Contents/Home` compiles the SDK 58 Android project when exported as `JAVA_HOME`; the SDK at `~/Library/Android/sdk` already holds platforms 35/36, NDK 27.1 and build-tools 36. The README should point at the bundled JBR instead of asking for a separate JDK install.

## R-17 App identity (placeholders)

**Decision**: name `Warehouse`, slug `warehouse`, scheme `warehouse`, iOS bundle identifier and Android package `com.hp.warehouse.app` (chosen 2026-10-29 after Apple reported `com.hp.warehouse` as already registered to another team). Change in `app.config.ts` only.

## R-18 Package manager

**Decision**: npm with a committed `package-lock.json`. `npx expo install` for every Expo-managed package. npm lacks native dependency patching, hence `patch-package` (R-10).

## R-19 CocoaPods environment on the development machine [VERIFIED]

`pod install` fails on this machine for **any** Expo SDK 57/58 project, independent of WatermelonDB, with `ArgumentError - unknown keyword: quirks_mode`. Cause: the `json` gem 3.1.0 is active under Ruby 3.4.8 (rvm) while ActiveSupport 7.2.3, which Expo's `expo-modules-autolinking` Ruby scripts call through CocoaPods 1.17.0, still passes `quirks_mode` to `JSON.generate`. Pinning `json` to 2.x fixes it; the scratch verification used a Gemfile (`cocoapods = 1.17.0`, `activesupport = 7.2.3`, `json ~> 2.21`) and `bundle exec pod install`.

Consequence for the README: `@expo/cli` 58.1.17 does **not** run CocoaPods through Bundler [VERIFIED, no `bundle exec` in its sources], so a Gemfile alone does not make `npx expo run:ios` work. Options to document: (a) remove `json` 3.x from the active Ruby (`gem uninstall json -v 3.1.0`) or pin via a global `~/.gemrc`/rvm gemset, or (b) run `bundle exec pod install` in `ios/` and then `npx expo run:ios --no-install`. **[ASSUMPTION]** other developers' machines may not have this gem combination; the README should present it as a troubleshooting entry, not a required step.

## R-20 Scratch verification artefacts

The verification used two throwaway projects under the session scratchpad (`sdk57/`, `sdk58/`), created with `create-expo-app --template blank-typescript@sdk-NN`, plus `@nozbe/watermelondb@0.28.0`, the plugin at `2.4.0-beta.0`, and a probe `App.tsx` that constructs `SQLiteAdapter({ jsi: true })`, writes and reads `database.localStorage`, and prints `_dispatcherType`. Logs: `build57-wdb.log`, `build58-wdb.log`, `build58-wdb-patched.log`, `run57.log`, `run58.log`, `gradle-sdk57.log`, `gradle-sdk58-unpatched.log`, `gradle-sdk58-patched.log`; screenshots `shot57.png`, `shot58.png`. Nothing in this repository was modified by the verification, and no dependency was installed into it. Xcode derived data and simulator installs created for the probe apps were removed afterwards; downloaded Gradle 9.3.1/9.4.1 distributions remain in `~/.gradle`.

## R-21 Android 16 KB page-size alignment [VERIFIED during implementation]

On an Android 16 (API 36) emulator with 16 KB pages, both the debug build and the R8 release build show the system "Android App Compatibility" notice listing many Expo and React Native libraries with "Unknown error". `llvm-readelf` shows those libraries' ELF segments are 16 KB aligned, so the notice for them most likely reflects APK-level packaging (zip alignment of uncompressed `.so` entries, `zipalign -P 16`), which the store-submission feature must investigate; the app runs normally in page-size-compatible mode. The release APK built with R8 on 2026-10-29 was inspected with `llvm-readelf`: every `lib/arm64-v8a/*.so` has 16 KB (`0x4000`) LOAD alignment **except `libwatermelondb-jsi.so`, which is 4 KB (`0x1000`)**. WatermelonDB 0.28.0 predates the 16 KB requirement; its unreleased changelog lists "[Android] Added linker flag for building with 16kB page alignment", which never shipped.

**Impact**: none for this feature (no store submission). Google Play requires 16 KB support for new apps and updates targeting Android 15+, so the store-submission feature must add the linker flag (`-Wl,-z,max-page-size=16384`) to `native/android-jsi/CMakeLists.txt` as a fifth hunk of the existing patch, or move to NitromelonDB, which builds with 16 KB alignment. Record this in that feature's spec.

## R-22 Implementation notes that changed the design (2026-10-29)

- `src/api/client.ts` uses ky 2's `prefix` option (formerly `prefixUrl`); the error normalizer reads `error.data` (see R-05).
- `app.config.ts` omits `newArchEnabled` (see R-02).
- Both screens wrap content in a `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`. On iOS 26 the native stack header floats over content; without the inset adjustment the Settings heading rendered under the header. Android is unaffected.
- The Settings test mocks `useDatabase` from `@nozbe/watermelondb/react` rather than `@/db/database`, because the screen reads the database from context, not from the module.
- `tsconfig.json` sets `types: ["jest"]`: TypeScript 6 no longer auto-includes `@types/*` packages. `baseUrl` was dropped (deprecated in TS 6; `paths` works without it).
- The development machine's CocoaPods failure (R-19) was worked around with the committed `Gemfile` and the `ios:pods` script; `expo prebuild` and `expo run:ios` are run with `--no-install` on this machine.
- Metro started by `expo run:*` under `CI=1` disables file watching; the README's `npm start` runs Metro normally.
