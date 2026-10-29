# Quickstart: Validating the Expo Mobile Foundation

**Feature**: `001-expo-mobile-foundation` | **Date**: 2026-10-29

Each scenario maps to the spec's acceptance criteria. Run them on a **clean clone**. Contracts referenced: [scripts](contracts/scripts.md), [environment](contracts/environment.md), [modules](contracts/modules.md).

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 22.13+ or 24.3+ (LTS; odd majors unsupported) | `node -v` |
| npm | 10+ | `npm -v` |
| Xcode + Command Line Tools | 16+ (26.x on the dev machine) with an iOS Simulator runtime | `xcodebuild -version` |
| CocoaPods | 1.15+ | `pod --version` |
| Watchman | any current | `watchman --version` |
| EAS CLI | 27+ | `npm i -g eas-cli && eas --version` |
| JDK (Android only) | 17 | `java -version` |
| Android Studio + SDK + one emulator (Android only) | API 35 image | `$ANDROID_HOME/emulator/emulator -list-avds` |

## Q1. Clean clone to iOS Simulator (spec US1, AC 1, 4, 15)

```sh
git clone <repo-url> warehouse && cd warehouse
cp .env.example .env
npm install                      # expect: no "ERESOLVE" / peer dependency errors
npm run ios                      # prebuild + pod install + build + launch
```

**Expected**: the Simulator opens the app on the Home screen. The header and heading read the translated title (Ukrainian if the Simulator language is Ukrainian, otherwise English). A filled, rounded Button is visible below the heading. Metro shows the bundle served to the dev client.

**Time budget**: under 30 minutes after prerequisites (SC-001). Note the first `pod install` dominates.

## Q2. Quality gates (spec US2, AC 2, 14)

```sh
npm run typecheck                # exit 0
npm run lint                     # exit 0, zero warnings
npm run format:check             # exit 0
npm test                         # exit 0; 4+ tests pass
git check-ignore .env ios android  # prints all three paths
grep -rniE "(api[_-]?key|secret|token)\s*[:=]\s*['\"][^'\"]{8,}" --exclude-dir=node_modules --exclude-dir=.git . ; echo "exit $?"   # expect exit 1 (no match)
```

**Pre-commit check**: add `const  x = 1` (double space) to any `.ts` file, `git add`, `git commit -m test`. Expected: lint-staged reformats or rejects; the committed file (if any) is formatted. Reset afterwards.

**Expected tests** (names indicative):

| Test file | Asserts |
|-----------|---------|
| `src/app/__tests__/index.test.tsx` | Home renders `home.title` text and the Button label |
| `src/app/__tests__/settings.test.tsx` | Settings renders `settings.title` and "schema version 1" with the database mocked |
| `src/api/client.test.ts` | a request goes to a URL starting with `process.env.EXPO_PUBLIC_API_URL` |
| `src/storage/secureStorage.test.ts` | `set` then `get` returns the value; `remove` then `get` returns `null` (expo-secure-store mocked) |

## Q3. Navigation and database diagnostic (spec US3, AC 7, 9)

With the app running from Q1:

1. Tap the Button on Home. **Expected**: native push transition to Settings with a back arrow in the header.
2. Read the diagnostic line. **Expected**: text equivalent to "Database ready, schema version 1".
3. Tap back. **Expected**: Home reappears.
4. Repeat on Android (Q6). **Expected**: identical behaviour.

Failure mode check (optional): temporarily make `src/db/database.ts` throw in `onSetUpError` path (e.g. pass an invalid `dbName` with a slash). **Expected**: Settings shows the error diagnostic; the app does not crash. Revert.

## Q4. Localization (spec US4, AC 8)

iOS Simulator: Settings app > General > Language & Region > add Ukrainian and make it primary; relaunch the app.

| Device language | Expected on Home and Settings |
|-----------------|-------------------------------|
| Ukrainian | all strings Ukrainian |
| English | all strings English |
| German (or any third language) | all strings English |

Lint enforcement: add `<Text>Hello</Text>` to `src/app/index.tsx`, run `npm run lint`. **Expected**: `i18next/no-literal-string` error. Revert.

## Q5. Physical iPhone via development build (spec US5, AC 5, 13)

Local route (no EAS account):

```sh
npm run ios:device               # choose the connected iPhone; Xcode signing with your team
npm start                        # Metro with --dev-client
```

**Expected**: the app installs, launches, and the dev-client launcher connects to Metro (bundle progress visible). Edit `home.title` in `src/i18n/locales/en.json`, save. **Expected**: the device updates without reinstall.

EAS validation:

```sh
eas login
npm run eas:config               # resolves development profile for iOS, exit 0
# optional full local build (needs fastlane): eas build --profile development --platform ios --local
```

## Q6. Android and appearance (spec US6, AC 6, 12)

```sh
npm run android                  # emulator must be running or auto-started
```

**Expected**: Home renders with the same title and Button as iOS; navigation Home → Settings → back works.

Appearance: on the iOS Simulator, Features > Toggle Appearance (or Settings > Developer > Dark Appearance). **Expected**: within one second, background and text colours switch between the light and dark palette without relaunch. The Button follows the `primary` token.

## Q7. Native regeneration (spec FR-002, SC-008)

```sh
rm -rf ios android
npm run prebuild                 # exit 0 for both platforms
npm run ios                      # builds again with no manual steps
```

After `npm install`, confirm the WatermelonDB patch applied: `grep -c RCTCxxBridge node_modules/@nozbe/watermelondb/native/ios/WatermelonDB/JSIInstaller.h` must print `0` (see [research.md R-01](research.md#r-01-expo-sdk-version-decision-sdk-58-with-a-four-hunk-watermelondb-patch)).

If `pod install` fails with `ArgumentError - unknown keyword: quirks_mode`, the machine's Ruby has the `json` 3.x gem active; see [research.md R-19](research.md#r-19-cocoapods-environment-on-the-development-machine-verified). If it fails with "multiple dependencies with different sources for `simdjson`", apply the contingency in [research.md R-03](research.md#r-03-watermelondb-integration) (`react-native.config.js`), commit it, and rerun. Neither failure reproduced on 2026-10-29 with the documented setup.

## Q8. README walkthrough (spec FR-023, SC-001)

Hand the README to a developer who has not seen the project. They must reach Q1's expected outcome using only the README. Record the time and any step they had to ask about; each such step is a README defect to fix before closing the feature.
