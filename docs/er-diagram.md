# IncidentIQ entity relationship diagram

```mermaid
erDiagram
  TEAMS ||--o{ USERS : contains
  TEAMS ||--o{ INCIDENTS : owns
  USERS ||--o{ INCIDENTS : reports
  USERS o|--o{ INCIDENTS : assigned
  INCIDENTS ||--o{ INCIDENT_COMMENTS : has
  USERS ||--o{ INCIDENT_COMMENTS : writes
  INCIDENTS ||--o{ INCIDENT_HISTORY : records
  USERS o|--o{ INCIDENT_HISTORY : performs
  USERS ||--o{ NOTIFICATIONS : receives
  INCIDENTS o|--o{ NOTIFICATIONS : relates_to
```

Note: the current schema stores SLA deadlines and breach flags directly on `incidents`, while `sla_policies` defines target durations by priority (matched in the service by priority rather than a foreign key). `notifications` is present as a schema foundation; a delivery worker is a future enhancement.
