# PROJECT_STATUS

Current Version: V1

Current Sprint: Sprint 2

Completed:

- Sprint 1 - Database + Authentication
- Tables
    - `users`
    - `user_progress`
    - `user_skills`
    - `user_incidents`
    - `attempts`
    - `attempt_files`
    - `hint_usage`
    - `llm_evaluations`
- Alembic migration
- Database schema applied successfully
- Register endpoint
- Login endpoint
- JWT access token creation and validation
- Password hashing with bcrypt
- Protected current-user route
- Auth middleware dependency for protected routes

Next Task:

- Incident folder loader
- `public.json` loader
- `private.json` loader
- Broken files loader
- Golden files loader
- Create 3-5 sample incidents
- `GET /api/v1/incidents/current`
- `POST /api/v1/incidents/{incident_id}/hint`
