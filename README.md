# IncidentIQ

Enterprise-style IT incident management built with Java 21, Spring Boot, React, TypeScript and MySQL 8.4.

## Features
- JWT login and roles: ADMIN, SUPPORT_LEAD, ENGINEER, REPORTER
- Incident intake, search, filters, pagination, assignment, lifecycle transitions, comments and audit timeline
- Priority-based response/resolution deadlines and scheduled SLA breach checks
- Workspace dashboard, team directory, reports and SLA policy views
- MySQL with Flyway migrations, Swagger/OpenAPI, health endpoint and Docker Compose

## Run with Docker
Install and start Docker Desktop, then from this directory run:
```powershell
.\start-incidentiq.ps1
```
Or use `docker compose up --build`. Stop with `.\stop-incidentiq.ps1` or `docker compose down`; neither command removes the database volume.
Open http://localhost:5173 (UI), http://localhost:8081/swagger-ui/index.html (API docs), and http://localhost:8081/actuator/health.

The local development profile seeds demo users and sample incidents. Demo logins (local development only):
- `admin@incidentiq.local` / `IncidentIQ@123`
- `engineer@incidentiq.local` / `IncidentIQ@123`
- `reporter@incidentiq.local` / `IncidentIQ@123`

## Production Compose profile
Create a protected `.env` file (do not commit it) and set `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` (at least 32 random bytes), and `CORS_ALLOWED_ORIGINS` to trusted HTTPS origins. Then run:
```powershell
docker compose -f docker-compose.prod.yml up --build -d
```
The production profile disables demo seeding and API documentation, does not publish the database or backend ports, and serves the UI through Nginx. Before first use, provision the initial operator account and reference data through your approved database-provisioning process; this starter does not include an account-registration endpoint or production bootstrap account. Put the published UI behind a TLS-terminating reverse proxy before exposing it publicly. The profile is a deployment example, not a production security certification.

For a local production-profile instance alongside the development stack, use an ignored `.env.local` file with unique local secrets, `CORS_ALLOWED_ORIGINS=http://localhost:5175`, and `FRONTEND_PORT=5175`:
```powershell
docker compose --env-file .env.local -p incidentiq-local-prod -f docker-compose.prod.yml up --build -d
```
Open http://localhost:5175. This loopback-only HTTP instance is for local use, not public exposure. Its generated local operator email and password are stored in `.env.local` as `INCIDENTIQ_ADMIN_EMAIL` and `INCIDENTIQ_ADMIN_PASSWORD`; keep that file private. Stop the instance without deleting its database using:
```powershell
docker compose --env-file .env.local -p incidentiq-local-prod -f docker-compose.prod.yml down
```

## Run without Docker
Backend: JDK 21, Maven 3.9+, MySQL 8.4; create database `incidentiq`, then run `cd backend && mvn spring-boot:run`.
Frontend: Node.js 20+, run `cd frontend && npm install && npm run dev`.
For direct backend runs, set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGINS` as environment variables as needed.

## Tests
Run backend tests with `cd backend && mvn verify`; the API integration tests use Testcontainers and MySQL 8.4 when Docker is available. For browser tests, install frontend dependencies and Chromium, then start a dedicated Compose project so tests do not modify the regular development database:
```powershell
$env:MYSQL_PORT = "3309"
$env:BACKEND_PORT = "8082"
$env:FRONTEND_PORT = "5174"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5174"
docker compose -p incidentiq-e2e-validation up --build -d
Set-Location frontend
npm ci
npx playwright install chromium
npm run test:e2e
Set-Location ..
docker compose -p incidentiq-e2e-validation down
```
This leaves the dedicated test volume intact and does not touch the normal development volume. Run the frontend production type-check/build with `cd frontend && npm ci && npm run build`.

## API
Base path `/api/v1`; login via `POST /auth/login`, then use `Authorization: Bearer <token>`.
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET /incidents?status=OPEN&priority=CRITICAL&search=portal&page=0&size=10`
- `POST /incidents`, `GET /incidents/{id}`, `PATCH /incidents/{id}`
- `POST /incidents/{id}/assign`, `POST /incidents/{id}/transition`
- `GET/POST /incidents/{id}/comments`, `GET /incidents/{id}/history`
- `GET /users`, `GET /teams`, `GET /sla/policies`

## Architecture
Modular monolith: controllers handle HTTP, services enforce business rules, repositories persist data, Flyway owns schema migrations, and a scheduled job checks SLA breaches. Docker Compose starts MySQL, API and Vite frontend.

## Important
This is a portfolio project starter, not a certified production service. Change demo credentials and JWT secret before public deployment. Configure HTTPS, restrictive CORS, rate limiting, secret management, notification retries, and review data privacy before real-world use.
