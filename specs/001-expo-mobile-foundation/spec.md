# Feature Specification: Expo Mobile Foundation

**Feature Branch**: `001-expo-mobile-foundation`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Initialize the foundation of a cross-platform mobile client for the existing Rails inventory back office. Deliver a minimal, runnable, well-structured mobile application with every baseline dependency installed and configured, no business features, that later tasks extend with authentication, local domain models, offline sync, inventory screens and QR scanning. iOS first, verified on the iOS Simulator and a physical iPhone; Android must build and launch but is not the acceptance focus. Technology stack is fixed (see Mandated Technology Constraints)."

## User Scenarios & Testing *(mandatory)*

The "users" of this feature are developers who will build the inventory client on top of this foundation. Warehouse staff do not interact with anything delivered here; the two screens are placeholders that prove the foundation works.

### User Story 1 - From clone to a running app on the iOS Simulator (Priority: P1)

A developer who has never seen the project clones the repository, follows the README, and within one sitting sees the app running in the iOS Simulator. The Home screen shows a title in the device language and a styled button. Nothing in the process requires tribal knowledge, manual edits to generated native projects, or guessing at missing steps.

**Why this priority**: This is the whole point of the foundation. If a developer cannot get the app running from the README alone, nothing built on top of it can be verified. Every other story depends on this one.

**Independent Test**: On a clean machine with the documented prerequisites installed, clone the repository, follow only the README, and confirm the Home screen renders a translated title and a styled button in the iOS Simulator.

**Acceptance Scenarios**:

1. **Given** a clean clone and the documented prerequisites, **When** the developer installs dependencies as the README instructs, **Then** installation completes without dependency conflict errors.
2. **Given** dependencies are installed, **When** the developer runs the documented "run on iOS Simulator" command, **Then** native projects are generated, the app builds, and the Home screen appears in the simulator.
3. **Given** the Home screen is visible, **When** the developer inspects it, **Then** it shows a title rendered from the translation resources and a button styled by the shared design system.
4. **Given** the README, **When** a developer with no prior project context follows it start to finish, **Then** they reach scenario 2 without consulting any other source.

---

### User Story 2 - Automated quality gates are green on a clean checkout (Priority: P2)

A developer or a continuous integration job runs the project's type check, lint, format check and test suite on a fresh checkout. Every check passes. Committing code that fails formatting or lint is blocked before it reaches the repository.

**Why this priority**: The foundation sets the quality bar for every later task. A green baseline makes any future regression unambiguous; a red baseline teaches developers to ignore failures.

**Independent Test**: On a clean clone, run the type check, lint and test commands and confirm each exits successfully. Stage a deliberately mis-formatted file and attempt a commit; confirm the commit is blocked or the file is auto-fixed before committing.

**Acceptance Scenarios**:

1. **Given** a clean clone with dependencies installed, **When** the type check command runs, **Then** it exits successfully with zero errors.
2. **Given** the same state, **When** the lint command runs, **Then** it exits successfully with zero errors.
3. **Given** the same state, **When** the test command runs, **Then** all tests pass, including at least one rendering test per placeholder screen, one unit test for the secure storage facility, and one unit test asserting the HTTP client's configured base address.
4. **Given** a staged file that violates formatting rules, **When** the developer commits, **Then** the pre-commit step either reformats the file or rejects the commit with a clear message.

---

### User Story 3 - Navigate between placeholder screens and confirm the local database is alive (Priority: P3)

A developer opens the app, taps through from Home to Settings and back using native stack navigation, and on Settings sees a diagnostic line confirming the local database opened and reporting its schema version.

**Why this priority**: Navigation and local persistence are the two subsystems every future feature touches. Proving they are wired correctly now prevents every later task from re-debugging the foundation.

**Independent Test**: Launch the app, navigate Home to Settings and back on iOS and Android, and read the schema version diagnostic on Settings.

**Acceptance Scenarios**:

1. **Given** the Home screen, **When** the developer triggers navigation to Settings, **Then** the Settings screen appears with a native stack transition and a back affordance.
2. **Given** the Settings screen, **When** the developer goes back, **Then** the Home screen is shown again with its state intact.
3. **Given** the app has started, **When** the Settings screen renders, **Then** it displays a diagnostic line stating the local database opened and showing schema version 1.
4. **Given** the local database fails to open, **When** the Settings screen renders, **Then** it displays a clear failure diagnostic instead of crashing the app.

---

### User Story 4 - The app speaks the device's language (Priority: P4)

A developer sets the simulator or device language to Ukrainian and every visible string in the app is Ukrainian. They switch to any other language and every visible string is English. No screen contains a string that bypasses the translation resources.

**Why this priority**: Warehouse staff are Ukrainian-speaking. Establishing "no hard-coded user-facing strings" as an enforced rule from the first commit is far cheaper than retrofitting it later.

**Independent Test**: Run the app with the device language set to Ukrainian, then to English, then to a third language; inspect both screens each time. Run the automated check that detects hard-coded user-facing strings.

**Acceptance Scenarios**:

1. **Given** the device language is Ukrainian, **When** the app launches, **Then** every visible string on Home and Settings is Ukrainian.
2. **Given** the device language is English, **When** the app launches, **Then** every visible string is English.
3. **Given** the device language is neither Ukrainian nor English, **When** the app launches, **Then** every visible string is English.
4. **Given** a component that contains a literal user-facing string, **When** the automated quality checks run, **Then** the violation is reported and the check fails.

---

### User Story 5 - Install and run on a physical iPhone (Priority: P5)

A developer builds a development version of the app, installs it on a physical iPhone, launches it, and the app connects to the running development server so that code changes appear on the device.

**Why this priority**: QR scanning and real warehouse use require a physical device. Confirming the development-build path works now removes a known blocker from the scanning task.

**Independent Test**: Follow the README's physical device section, install the development build on an iPhone, launch it, and confirm it connects to the development server and shows the Home screen.

**Acceptance Scenarios**:

1. **Given** a connected or registered iPhone and the README's device instructions, **When** the developer produces and installs a development build, **Then** the app launches on the device.
2. **Given** the app is running on the device and the development server is running, **When** the developer edits a placeholder screen, **Then** the change appears on the device without reinstalling.
3. **Given** the development build configuration, **When** the developer validates it locally or as a dry run, **Then** validation reports zero configuration errors.

---

### User Story 6 - Platform and appearance parity (Priority: P6)

The same app launches in an Android emulator with the same Home screen, and on either platform switching the system between light and dark appearance restyles the app immediately without a restart.

**Why this priority**: Android is explicitly secondary but must not silently drift. Appearance following the system is a baseline expectation of a modern mobile app and is cheapest to establish before any real screens exist.

**Independent Test**: Run the app in an Android emulator and confirm the Home screen matches iOS. On the iOS Simulator, toggle appearance between light and dark and observe the Home screen restyle without relaunching.

**Acceptance Scenarios**:

1. **Given** an Android emulator, **When** the developer runs the documented Android command, **Then** the app launches and the Home screen shows the same translated title and styled button as iOS.
2. **Given** the app is running, **When** the system appearance switches between light and dark, **Then** the Home screen restyles to match within one second and without restarting.
3. **Given** either platform, **When** navigation Home to Settings and back is exercised, **Then** it behaves identically on both.

---

### Edge Cases

- **Device locale cannot be determined**: the app falls back to Ukrainian, the project default.
- **Device language changes while the app is running**: strings update on the next app launch; live switching is not required in this phase.
- **Configured server address is missing**: the app still launches (no network calls are made yet) and a clear developer-facing message identifies the missing setting. The address is never silently treated as empty.
- **Local database fails to open on device**: the Settings diagnostic reports the failure; the app does not crash.
- **Secure storage is unavailable or the key is absent**: reading returns an explicit "no value" result rather than throwing.
- **Device is offline**: the app launches and both screens work, because nothing in this phase depends on the network.
- **Developer opens the project in the sandboxed preview client instead of a development build**: the README states this is unsupported and explains why a development build is required.
- **Generated native project folders are deleted**: regenerating them from configuration reproduces a working build with no manual steps.
- **Dependency versions drift**: all framework-managed packages are installed through the framework's compatibility-aware installer so a clean install resolves without conflicts.

## Requirements *(mandatory)*

### Functional Requirements

**Project foundation**

- **FR-001**: The project MUST be a cross-platform mobile application written in strictly typed code, with the framework's new rendering architecture enabled, and MUST run as a custom development build (not the sandboxed preview client) because local persistence requires native code.
- **FR-002**: The project MUST generate its native iOS and Android projects from version-controlled configuration with no manual edits to generated files; regenerating from a clean state MUST succeed for both platforms.
- **FR-003**: The project MUST pin its framework version and install all framework-managed packages through the framework's compatibility-aware installer so that a clean install completes without dependency conflict errors.
- **FR-004**: The project MUST use a documented source layout that separates routes, features, shared user-interface components, data access (local database and HTTP client), localization, application state and utilities, with path aliases usable from both the type checker and the bundler.

**Quality gates**

- **FR-005**: The project MUST expose consistently named commands for type checking, linting, formatting and testing, and all MUST exit successfully on a clean checkout.
- **FR-006**: The project MUST block commits of unformatted or lint-failing staged files through a pre-commit hook.
- **FR-007**: The project MUST include automated tests covering at least: one rendering test per placeholder screen, one unit test proving the secure storage facility round-trips a value with the underlying store mocked, and one unit test asserting the HTTP client's configured base address.
- **FR-008**: The project MUST enforce, by an automated lint rule or test, that components contain no hard-coded user-facing strings.

**Configuration and secrets**

- **FR-009**: The project MUST read the back-office server address from a public environment variable, provide a committed example file documenting it, and keep the real environment file out of version control.
- **FR-010**: The repository MUST contain no API keys, tokens or other secrets.
- **FR-011**: When the server address is absent, the app MUST still launch and MUST surface a clear developer-facing message rather than silently using an empty address.

**Navigation and screens**

- **FR-012**: The app MUST provide a root layout that installs the shared providers (local database, localization, safe-area handling) once for the whole app.
- **FR-013**: The app MUST provide exactly two placeholder screens, Home and Settings, in a single native stack with working forward and back navigation on both platforms.
- **FR-014**: The Home screen MUST render a translated title and one button from the shared component library; the Settings screen MUST render a diagnostic line showing whether the local database opened and its schema version.

**Data layer**

- **FR-015**: The app MUST open a local on-device database at startup with an empty schema at version 1 (no tables), make it available to the component tree through a provider, and include no domain models or synchronization logic.
- **FR-016**: The app MUST provide a single HTTP client instance configured with the server address from the environment and a normalizer that converts error responses into a consistent, typed shape; no endpoints are called in this phase.
- **FR-017**: The app MUST provide a thin, typed secure key-value storage facility with read, write and delete operations; no values are stored in this phase.

**Localization**

- **FR-018**: The app MUST ship Ukrainian and English translation resources, detect the device language at startup, use Ukrainian when the device is Ukrainian or the locale is undeterminable, and use English for any other device language.
- **FR-019**: All visible strings on the placeholder screens MUST come from the translation resources.

**Appearance**

- **FR-020**: The app MUST style components through the shared utility-class styling system and MUST follow the system light or dark appearance, restyling immediately when the system appearance changes.

**Build and documentation**

- **FR-021**: The project MUST define build profiles for development (custom development client, internal distribution), preview and production; no builds are submitted in this phase, and the development profile MUST validate without errors.
- **FR-022**: The README MUST list prerequisites, setup, running on the iOS Simulator, running on a physical iPhone through a development build, running tests and lint, a folder structure overview, and a short Contributing section describing where new code goes.
- **FR-023**: The README alone MUST be sufficient for a new developer to reach a running app in the iOS Simulator.

### Mandated Technology Constraints

The requester fixed the following choices and declared them not open for substitution. They are recorded here as constraints on the planning phase, not as design decisions made by this specification.

| Concern | Mandated choice |
|---------|-----------------|
| Language | TypeScript with strict mode |
| Framework | Expo SDK (latest stable, pinned) on React Native with the New Architecture enabled |
| Runtime | Expo Dev Client (not Expo Go) |
| Navigation | Expo Router (file-based routing), native stack on iOS |
| Local persistence | WatermelonDB on SQLite via JSI, integrated through the WatermelonDB Expo config plugin |
| HTTP client | ky |
| Secure storage | expo-secure-store |
| UI state | Zustand |
| Forms | react-hook-form + zod |
| Styling | NativeWind (Tailwind) + react-native-reusables |
| Localization | i18next + react-i18next, Ukrainian default, English fallback |
| Testing | Jest + React Native Testing Library |
| Build tooling | EAS with development, preview and production profiles |
| Code quality | ESLint (Expo config + typescript-eslint), Prettier, lint-staged pre-commit hook |

Additional conventions from the requester:

- Follow KISS and YAGNI: no abstractions beyond what the listed scope needs.
- Comments only where logic is non-obvious.
- All configuration lives in version control; no manual native project edits that regeneration would overwrite.
- Generated native folders may be excluded from version control if configuration plugins cover every native change.

### Out of Scope

- Business screens, create/read/update/delete flows, inventory domain models.
- Back-office API integration, sign-in, token refresh.
- Offline synchronization, conflict resolution, stock movements.
- QR or barcode scanning, camera permissions.
- Production deployment, App Store or Play Store submission, over-the-air updates.
- Analytics and crash reporting.
- Live language switching without restart.
- Any user-facing functionality for warehouse staff.

### Key Entities

- **Environment configuration**: the set of public, non-secret settings the app reads at build and run time. In this phase it holds only the back-office server address.
- **Translation resource**: a per-language collection of keyed user-facing strings. Two exist: Ukrainian (default) and English (fallback).
- **Local database**: the on-device persistent store, opened at startup with schema version 1 and no tables. Later features add tables and models.
- **Secure storage entry**: a key and string value held in the device's protected storage. None are written in this phase.
- **Build profile**: a named configuration (development, preview, production) describing how the app is packaged and distributed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with the documented prerequisites installed reaches a running Home screen in the iOS Simulator in under 30 minutes using only the README, on the first attempt.
- **SC-002**: On a clean checkout, 100% of the type check, lint and test commands exit successfully, with zero errors.
- **SC-003**: The automated test suite contains at least four passing tests: one per placeholder screen, one for secure storage round-trip, one for the HTTP client base address.
- **SC-004**: With the device language set to Ukrainian, 100% of visible strings on both screens are Ukrainian; with any other language, 100% are English. The hard-coded string check reports zero violations.
- **SC-005**: Navigation Home to Settings and back succeeds on 100% of attempts on both iOS and Android, with each transition completing in under one second.
- **SC-006**: The Settings diagnostic reports a successfully opened local database at schema version 1 on 100% of launches on the simulator and a physical iPhone.
- **SC-007**: Switching system appearance restyles the Home screen within one second and without restart, on 100% of toggles.
- **SC-008**: Regenerating native projects from a clean state succeeds for both platforms with zero manual steps.
- **SC-009**: Validation of the development build profile reports zero configuration errors.
- **SC-010**: A repository scan finds zero secrets, and the real environment file is confirmed excluded from version control.
- **SC-011**: A development build installed on a physical iPhone launches and connects to the development server on the first attempt following the README.
- **SC-012**: The app launches in an Android emulator and shows a Home screen visually equivalent to iOS (same title, same button, same translation).

## Assumptions

- **Repository location**: this repository currently contains only tooling configuration, so the mobile application lives at the repository root rather than in a subfolder. The Rails back office lives in a separate repository and is not touched.
- **Package manager**: npm is used; the commands in the acceptance criteria are written for npm. Substituting another manager is a planning-phase decision that must keep the same script names.
- **App identity**: the display name and bundle/application identifier are not specified. Planning picks sensible placeholders that can be changed later without code changes.
- **Generated native folders**: the iOS and Android native folders are excluded from version control and regenerated on demand, on the assumption that configuration plugins cover every required native change. If a native change cannot be expressed through configuration, the planning phase revisits this.
- **Hard-coded string enforcement**: a lint rule is preferred over a test because it gives feedback in the editor; either satisfies the requirement.
- **Language behavior**: "Ukrainian default, English fallback" is interpreted as: device set to Ukrainian shows Ukrainian; any other detectable language shows English; an undeterminable locale shows Ukrainian. Missing individual keys in Ukrainian fall back to the English string.
- **Physical device path**: the README documents one working route to a physical iPhone (either a locally compiled development build or a development build produced by the build service). Both are acceptable as long as the device connects to the development server.
- **Missing server address**: because no endpoints are called in this phase, a missing address degrades to a visible developer message rather than a startup failure. Later tasks that actually call the server may tighten this.
- **Android verification depth**: Android is verified only as "builds and launches with the same Home screen and navigation"; visual polish and device-specific issues on Android are deferred.
- **Form and state libraries**: the mandated form and state management libraries are installed and configured but have no consumers in this phase, since no forms or shared state exist yet.
- **Git branch**: no feature branch was created by this command; the developer creates one when implementation starts.
