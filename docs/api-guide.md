# API guide

Base URL: `http://localhost:8080/api/v1`

## Authenticate
`POST /auth/login`
```json
{"email":"admin@incidentiq.local","password":"IncidentIQ@123"}
```
The response includes a JWT and user summary. Send it as `Authorization: Bearer <token>`.

## Create an incident
`POST /incidents`
```json
{
  "title": "Payment API returns 502",
  "description": "Checkout requests intermittently fail when the gateway connection pool is saturated.",
  "priority": "CRITICAL",
  "category": "API",
  "teamId": 1
}
```
The authenticated user is always the reporter; the API ignores any client-supplied reporter ID because no such field is accepted.

## Search
`GET /incidents?status=OPEN&priority=CRITICAL&search=payment&page=0&size=10`

## Lifecycle transition
`POST /incidents/{id}/transition`
```json
{"status":"IN_PROGRESS","note":"Engineer investigating connection pool saturation."}
```
Invalid transitions return HTTP 409. Assignment is restricted to ADMIN and SUPPORT_LEAD; incident edits and lifecycle transitions are restricted to ADMIN, SUPPORT_LEAD, and ENGINEER.

## Useful endpoints
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET /incidents/{id}`
- `PATCH /incidents/{id}`
- `POST /incidents/{id}/assign`
- `GET/POST /incidents/{id}/comments`
- `GET /incidents/{id}/history`
- `GET /users`, `GET /teams`, `GET /sla/policies`
- `GET /actuator/health`
