# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-05-22

### Added
- **End-to-End Testing**: Implemented a comprehensive test suite using Playwright (`tests/auth.spec.ts`, `tests/patient-workflow.spec.ts`, `tests/rounds.spec.ts`).
- **QA Documentation**: Added `QA_REPORT.md` detailing the findings of the full quality assurance audit.
- **Migration Plan**: Added `SHIFT_PLAN.md` documenting the strategy and verification for the AI model shift.
- **Test Infrastructure**: Configured Playwright to run against the local environment without network mocks for realistic integration testing.

### Changed
- **AI Model Upgrade**: Shifted all AI services (Triage, SOAP generation, Summaries, RAG) to use the `gemini-2.5-flash` model to optimize for speed and efficiency.
- **Test Logic**: Updated `tests/e2e.spec.ts` to support deeper workflow verification (Discharge Summary navigation) and removed legacy mocks.
- **UI Robustness**: Improved `data-testid` usage and role-based selectors in tests to handle dynamic UI states better.

### Fixed
- **Form Validation**: Addressed issues where form submission buttons in the Reception module were not interactable during automation due to missing field validation requirements.
- **Strict Mode Violations**: Resolved Playwright strict mode errors caused by duplicate text elements in the DOM (e.g., "Active Orders").
