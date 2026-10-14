# Runtime Validation Report

**Generated**: 2026-10-15T03:52:10+05:30
**Target**: `C:\Users\mohdk\Downloads\IncidentIQ\IncidentIQ`

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Startup | PASS | 0 | Isolated development stack reached healthy MySQL/backend states and the Vite frontend served the app. The production stack also reached healthy container states. |
| Backend integration tests | PASS | 0 | `mvn -q -Dapi.version=1.44 verify`: 7 tests, 0 failures, 0 errors, 0 skipped. |
| Browser E2E | PASS | 0 | Playwright: 3 journeys passed; authentication, incident persistence, workflow transition and note persistence verified. |
| Frontend build | PASS | 0 | `npm run build` (TypeScript plus Vite production build). |
| Production dependency audit | PASS | 0 | `npm audit --omit=dev`: 0 vulnerabilities. |
| Compose configuration | PASS | 0 | Development and production Compose configurations parsed successfully using validation-only environment values. |
| Production smoke | PASS | 0 | Production frontend returned HTTP 200 for `/` and `/healthz`; backend actuator returned `{"status":"UP"}`; all three containers were healthy. |
| Local production-profile deployment | PASS | 0 | Separate `incidentiq-local-prod` stack is running at `http://localhost:5175`; admin login works in browser and API; all three containers are healthy. |

**Overall**: PASS

## Test Evidence

- Backend reports: `backend/target/surefire-reports/`
  - `IncidentApiIntegrationTest`: 3 passed, 0 failed, 0 skipped; Testcontainers MySQL 8.4.
  - `IncidentWorkflowTest`: 4 passed, 0 failed, 0 skipped.
- Browser tests: `frontend/e2e/`
  - `authentication.spec.ts`: rejects invalid credentials, signs in, checks the current-user API and workspace status.
  - `incident-create.spec.ts`: creates an incident and verifies it remains available in the incident queue.
  - `incident-workflow.spec.ts`: transitions an incident, adds a note and verifies both after reload.
- Playwright output: `frontend/test-results/` and `frontend/playwright-report/`.
- The E2E and production smoke tests used dedicated Compose projects and database volumes. Both validation stacks and their volumes were removed after testing. The pre-existing `incidentiq` services remain running.

## Issues Found and Resolved

| Issue | Resolution |
|---|---|
| CI used `127.0.0.1` while the Compose CORS default trusts `localhost`. | Changed the Playwright CI URL to `http://localhost:5173`; the local isolated run used its matching `localhost:5174` origin. |
| The authentication test's `API connected` text matched three status labels. | Scoped the assertion to the header status indicator. |
| Frontend Docker context included host dependencies and build/test output. | Added `frontend/.dockerignore`; the rebuilt frontend context was approximately 1 KB rather than the earlier 139 MB. |

## Operational Notes and Known Gaps

- The Windows Docker Desktop Testcontainers run required `DOCKER_HOST=npipe:////./pipe/dockerDesktopLinuxEngine` and `-Dapi.version=1.44`. Docker-backed integration tests did run; they were not skipped.
- Flyway emitted a non-blocking compatibility warning: this Flyway version lists MySQL 8.1 as its latest tested version, while validation used MySQL 8.4. Migrations completed successfully.
- The production profile correctly does not seed demo accounts. The isolated local deployment was separately provisioned with one administrator and an operations team; browser UI login, dashboard loading, API status, and authenticated `/api/v1/auth/me` were verified.
- Local-only random secrets and the generated admin password are stored in the ignored `.env.local` file. Keep it private. The UI binds to loopback HTTP on port 5175; this local deployment is not public-facing and is not a cloud deployment.
- No cloud credentials were used, and the existing development database volume was not changed.

## Runtime Verdict

```text
environment:
  docker: AVAILABLE — Docker Desktop operational; Testcontainers used the Docker Desktop named pipe and API compatibility override
  node: AVAILABLE — Node.js v24.19.0
  playwright: AVAILABLE — Playwright 1.64.1; Chromium launched and completed the browser suite
  infra-tier: PRIMARY(Docker-based) — MySQL 8.4 via Testcontainers and isolated Compose stacks
  browser-tier: PRIMARY(Playwright) — real browser against the running SPA and API
startup: PASS — isolated Compose startup; backend actuator and frontend health checks passed
integration: PASS — exit_code: 0, passed: 7, failed: 0, skipped: 0; MySQL-backed auth, authorization, validation, incident and workflow coverage
e2e: PASS — exit_code: 0, passed: 3, failed: 0; invalid/valid login, current-user API, incident create/read, workflow transition and note persistence; isolated MySQL boundary
overall: PASS — build, integration, browser journeys, dependency audit, production smoke and local production-profile deployment passed; Flyway/MySQL compatibility remains a deployment note
```
