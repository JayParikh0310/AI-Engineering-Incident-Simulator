# PROJECT_STATUS

Current Version: V1
Current Sprint: Sprint 2

## Completed

### Sprint 1 - Database + Authentication
- [x] Users table + SQLAlchemy models
- [x] Alembic migrations applied
- [x] Register / Login endpoints
- [x] JWT middleware & Auth dependencies
- [x] Password hashing (bcrypt)

### Sprint 2 - Incident Engine (In Progress)
- [x] **Create Sample Incidents** (5 incidents ready)
    - `fastapi-001`: Vanishing Todo Endpoints (Router not registered)
    - `fastapi-002`: Database Connectivity Issues (Wrong DB URL)
    - `fastapi-003`: Auth System Malfunction (JWT Secret Mismatch)
    - `fastapi-004`: Unprotected Endpoints (Auth Dependency Missing)
    - `fastapi-005`: Unexplained Upload Failures (Upload Directory Missing)
- [ ] Incident Pydantic Schemas
- [ ] Incident Folder Loader (Logic)
- [ ] API Endpoints:
    - `GET /api/v1/incidents/current`
    - `POST /api/v1/incidents/{incident_id}/hint`

## Next Tasks
1. Define Pydantic schemas in `backend/src/schemas/incident_schema.py`.
2. Implement `IncidentLoader` in `backend/src/incident_engine/loader.py`.
3. Create `GET /api/v1/incidents/current` endpoint.
4. Create `POST /api/v1/incidents/{incident_id}/hint` endpoint.
