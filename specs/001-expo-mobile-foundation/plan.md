# Implementation Plan: Expo Mobile Foundation

**Branch**: `001-expo-mobile-foundation` | **Date**: 2026-10-29 (revised after native build verification) | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-expo-mobile-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Create a runnable, test-covered Expo application skeleton at the repository root that later features (auth, domain models, offline sync, inventory screens, QR scanning) extend without re-touching the foundation. Two placeholder screens (Home, Settings) prove navigation, localization, styling, local database startup, environment configuration and the quality gates. Technical approach: Expo SDK 58 with Continuous Native Generation and a development client, Expo Router native stack, WatermelonDB (empty schema v1, JSI) via its Expo config plugin, ky, expo-secure-store, i18next, NativeWind + react-native-reusables, Jest + React Native Testing Library, EAS profiles, ESLint/Prettier/lint-staged.

**One decision needs the requester's confirmation** (see [research.md R-01](research.md#r-01-expo-sdk-version-decision-sdk-58-with-a-four-hunk-watermelondb-patch)): the brief mandates both "latest stable Expo SDK" and WatermelonDB, but WatermelonDB 0.28.0 does not compile on React Native 0.88 (Expo SDK 58) on either platform. Verified on this machine on 2026-10-29: a four-hunk source patch makes it compile on iOS and Android and the JSI adapter works at runtime on the iOS Simulator under the New Architecture. This plan therefore pins **SDK 58** and carries that patch with `patch-package`. The fallback, **SDK 57** (React Native 0.86.3) where WatermelonDB builds unpatched, was verified to the same depth and remains a one-line switch if the team does not want to patch third-party native code. Android runtime and physical-device checks are not yet done for either SDK.

## Technical Context

**Language/Version**: TypeScript ~6.0.3 (`strict: true`), as shipped by the Expo SDK 58 template

**Primary Dependencies**: `expo@~58.0.21` (React Native 0.88.1, React 19.3.0, New Architecture mandatory), `expo-router@~58.0.28`, `expo-dev-client@~58.0.17`, `@nozbe/watermelondb@0.28.0` patched via `patch-package@^8` (see research R-01) + `@morrowdigital/watermelondb-expo-plugin@2.4.0-beta.0`, `ky@^2.2`, `expo-secure-store@~58.0.2`, `zustand@^5`, `react-hook-form@^7.91` + `zod@^4` + `@hookform/resolvers@^6`, `nativewind@4.2.7` + `tailwindcss@^3.4.19` + react-native-reusables (`Button`, `Text`), `i18next@^26` + `react-i18next@^17` + `expo-localization@~58.0.5`

**Storage**: WatermelonDB on SQLite (JSI), schema version 1 with zero tables; expo-secure-store for secrets (no values written in this phase)

**Testing**: `jest-expo@~58.0.13` preset on Jest 30, `@testing-library/react-native@^14`, `expo-router/testing-library`

**Target Platform**: iOS 15.1+ (SDK 58 default) on Simulator and physical iPhone via dev client; Android (API 24+) emulator parity

**Project Type**: mobile-app (single Expo project at repository root)

**Performance Goals**: cold launch to interactive Home under 5 s on the iOS Simulator; stack transitions under 1 s; appearance change reflected under 1 s (spec SC-005, SC-007)

**Constraints**: New Architecture only; dev client only (no Expo Go); all native changes via config plugins or the version-controlled `patches/` file; `ios/` and `android/` gitignored and regenerated; `npx expo install` for Expo-managed packages; zero secrets in the repository; KISS/YAGNI

**Scale/Scope**: 2 screens, 3 routes, ~8 source modules, 4 automated tests, 1 config plugin, 3 EAS profiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is the unfilled template, so no ratified project principles exist. The gates below are taken from the spec's "Mandated Technology Constraints" and "Additional conventions".

| Gate | Pre-research | Post-design |
|------|--------------|-------------|
| G1. Mandated stack used without substitution | PASS: latest stable SDK 58 and every library in the table, with one documented addition: a four-hunk patch to WatermelonDB's native sources (R-01). | PASS (patch verified by native builds on both platforms; recorded in Complexity Tracking) |
| G2. KISS/YAGNI: no abstraction beyond listed scope | PASS: no feature folders, no state store, no form components are created because nothing consumes them. Mandated form/state libraries are installed only. | PASS: data layer is three small modules; no repository pattern, no service layer |
| G3. All configuration in version control, no manual native edits | PASS: config plugins cover every native change; the WatermelonDB patch is a version-controlled file applied automatically on install, not a manual edit | PASS |
| G4. Reproducible native projects (`ios/`, `android/` generated) | PASS: CNG with gitignored native folders | PASS |
| G5. Pinned SDK, `npx expo install` for Expo packages | PASS: SDK 58 pinned; third-party packages pinned with caret ranges in `package.json` and `package-lock.json` | PASS |
| G6. Comments only where logic is non-obvious | PASS by convention; enforced in review | PASS |

No gate failures. Complexity Tracking records the one addition to the mandated stack and one downgraded contingency.

## Project Structure

### Documentation (this feature)

```text
specs/001-expo-mobile-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── environment.md   # Environment variables and app config contract
│   ├── scripts.md       # package.json script contract
│   └── modules.md       # Internal module contracts (db, api, storage, i18n)
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.
├── app.config.ts            # Expo config: identity, plugins, newArchEnabled, env warning
├── babel.config.js          # babel-preset-expo (jsxImportSource nativewind, decorators legacy) + nativewind/babel
├── metro.config.js          # withNativeWind(config, { input: './global.css', inlineRem: 16 })
├── tailwind.config.js       # nativewind preset, darkMode 'class', reusables colour tokens
├── global.css               # Tailwind directives + CSS variable palette (light / dark)
├── nativewind-env.d.ts      # NativeWind className types
├── components.json          # react-native-reusables CLI config (aliases -> src/)
├── tsconfig.json            # extends expo/tsconfig.base, strict, paths @/* -> src/*
├── eslint.config.js         # expo flat + typescript-eslint + i18next + prettier
├── .prettierrc              # + prettier-plugin-tailwindcss
├── jest.config.js           # preset jest-expo, moduleNameMapper, transformIgnorePatterns (+ky), setupFiles
├── jest.setup.ts            # env var, expo-secure-store and expo-localization mocks
├── eas.json                 # development / preview / production profiles
├── patches/                 # @nozbe+watermelondb+0.28.0.patch (RN 0.88 compile fix, research R-01)
├── .env.example             # EXPO_PUBLIC_API_URL
├── .gitignore               # .env, ios/, android/, node_modules/, .expo/
├── .husky/pre-commit        # lint-staged
├── package.json             # scripts: start, ios, android, prebuild, typecheck, lint, format, test, postinstall (patch-package)
├── README.md                # prerequisites, setup, run, test, structure, contributing
└── src/
    ├── app/                 # Expo Router routes (file-based)
    │   ├── _layout.tsx      # SafeAreaProvider > DatabaseProvider > I18nextProvider > ThemeProvider > Stack
    │   ├── index.tsx        # Home: translated title, reusables Button linking to Settings
    │   ├── settings.tsx     # Settings: translated title, database diagnostic line
    │   └── __tests__/       # index.test.tsx, settings.test.tsx (renderRouter)
    ├── components/ui/       # react-native-reusables output: button.tsx, text.tsx
    ├── db/                  # schema.ts (appSchema v1, no tables), database.ts (adapter + Database)
    ├── api/                 # client.ts (ky instance), errors.ts (ApiError + normalizer), client.test.ts
    ├── storage/             # secureStorage.ts (get/set/remove), secureStorage.test.ts
    ├── i18n/                # index.ts (init + detection), locales/uk.json, locales/en.json, i18next.d.ts
    └── lib/                 # utils.ts (cn), theme.ts (NAV_THEME)
```

Reserved, documented in README "Contributing", created when first needed: `src/features/<feature>/` (screens, hooks, components owned by one feature), `src/state/` (Zustand stores), `src/db/models/` (WatermelonDB models and migrations).

**Structure Decision**: Single Expo project at the repository root (the repository contains only tooling today; the Rails back office lives elsewhere). Routes stay thin under `src/app/`; everything else is grouped by technical concern under `src/` because no business feature exists yet. Tests are colocated with the module they cover.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Four-hunk `patch-package` patch to `@nozbe/watermelondb@0.28.0` native sources (gate G1/G3) | WatermelonDB 0.28.0 fails to compile on React Native 0.88 / AGP 9 (iOS `RCTCxxBridge` removed; Android `BuildConfig` no longer forced on for libraries). Verified 2026-10-29: unpatched fails and patched compiles on both platforms; JSI adapter works at runtime on the iOS Simulator. Upstream is dormant, so no release will carry the fix. | Pin SDK 57 (builds unpatched, equally verified): rejected as baseline because it violates "latest stable", only defers the same patch to the next SDK upgrade, and shortens the support window by about four months. Kept as the documented fallback. Switch to the maintained NitromelonDB fork: rejected because the brief names WatermelonDB. |
| `react-native.config.js` disabling iOS autolinking of `@nozbe/simdjson` (contingent, now unlikely) | Reported duplicate-`simdjson` `pod install` failure with the WatermelonDB plugin on Expo 54+. Did not reproduce on SDK 57 or 58 with CocoaPods 1.17.0 on 2026-10-29. | Manual Podfile edit: forbidden by gate G3 and overwritten by prebuild. Apply only if a developer machine reproduces the failure. |

## Phase 0: Research (complete)

See [research.md](research.md). All technical unknowns are resolved; none remain marked NEEDS CLARIFICATION. R-01 is a resolved decision backed by native builds on this machine; the requester may still choose the SDK 57 fallback. R-19 records a CocoaPods environment problem on the development machine that the README must cover.

## Phase 1: Design (complete)

- [data-model.md](data-model.md): environment configuration, translation resources, local database schema, secure storage entries, API error shape, build profiles.
- [contracts/environment.md](contracts/environment.md), [contracts/scripts.md](contracts/scripts.md), [contracts/modules.md](contracts/modules.md): the interfaces the foundation exposes to future feature work.
- [quickstart.md](quickstart.md): runnable validation mapped to the spec's acceptance scenarios.

## Implementation Notes for `/speckit-tasks`

Ordering that avoids rework, derived from the research:

1. Scaffold with `npx create-expo-app@latest --template blank-typescript@sdk-58`, then move `App.tsx` out and install `expo-router` + `expo-dev-client`; set `main` to `expo-router/entry`.
2. Add `patch-package` and the WatermelonDB patch (`npx patch-package @nozbe/watermelondb` after applying the four hunks from research R-01) before the first prebuild, with `"postinstall": "patch-package"` in `package.json`; verify a clean `npm install` re-applies it.
3. Tooling before code: tsconfig strict + paths, ESLint flat, Prettier, husky + lint-staged, Jest config. Commit the green gate before adding features.
4. Styling before screens: NativeWind manual setup, then `npx @react-native-reusables/cli@latest add button` so the Button and Text components exist before Home is written.
5. Providers and routes: i18n init, database module, root layout, Home, Settings.
6. Native: `app.config.ts` plugins, `npx expo prebuild --clean`, `npx expo run:ios`. If `pod install` fails with `unknown keyword: quirks_mode`, that is the machine's Ruby `json` gem (research R-19), not the project. Apply the simdjson contingency only on failure.
7. Tests last for each module they cover, but the test gate must be green before the README is finalized.
8. README and `.env.example` last, verified by a clean-clone walkthrough (quickstart scenario Q1).

Test to confirm on device, not in Jest: database opens (Settings diagnostic) on iOS **and Android**, dark mode restyle, physical iPhone dev-client connection, one Android release build (R8 keep rule). These are the checks the research could not run.
