# PROJECT_STATUS

Current Version: V1
Current Sprint: Sprint 4

## Completed

### Sprint 1 - Database + Authentication
- [x] Users table + SQLAlchemy models
- [x] Alembic migrations applied
- [x] Register / Login endpoints (Backend)
- [x] JWT middleware & Auth dependencies
- [x] Password hashing (bcrypt)
- [x] **New:** Fully functional Registration Page (Frontend)
- [x] **New:** Centralized `AuthProvider` for stable state management
- [x] **New:** Hardened validation and custom error messaging

### Sprint 2 - Incident Engine (Completed)
- [x] **Create Sample Incidents** (5 incidents ready)
- [x] Incident Pydantic Schemas
- [x] Incident Folder Loader (Logic)
- [x] API Endpoints:
    - `GET /api/v1/incidents/current`
    - `POST /api/v1/incidents/{incident_id}/hint`

### Sprint 3 - Frontend Incident Viewer (Completed)
- [x] Setup Monaco Editor integration.
- [x] Implement Files Sidebar.
- [x] Build Incident Page with Logs and Hint panels.
- [x] Responsive Monochrome UI/UX.
- [x] **Hardening:** Fixed infinite redirect loops and CORS flakiness.
- [x] **UX:** Clear fields on login failure and provide descriptive feedback.

## Next Tasks
1. **Sprint 4 - Submission Pipeline**
    - Implement `POST /api/v1/attempts/submit`.
    - Build `evaluation_service.py` with LLM integration.
    - Store and track attempts.

Phase 1: Data Models & Schema Validation
  Focus: Preparing the backend to store submission data and defining the structured output format for the LLM.

   * Actions:
       1. Define/Verify Pydantic models for attempts, attempt_files, and llm_evaluations.
       2. Define the LLM structured output schema (Pydantic) to be used for validation of the LLM response.
       3. Implement SQLAlchemy models (if not already completed) and run Alembic migrations.
   * Outcome: Database schema and Pydantic validation schemas are ready, allowing us to safely store and validate submission data.

  ---

  Phase 2: Submission Pipeline & Persistence
  Focus: Establishing the API endpoint and the capability to save incoming user submissions.

   * Actions:
       1. Create the POST /api/v1/incidents/{incident_id}/submit endpoint.
       2. Implement save_attempt and save_attempt_files in the repository layer.
       3. Develop basic endpoint logic: receive files, validate them, save to DB, and return a "processing" status.
   * Outcome: A functioning endpoint that accepts submissions, persists them to the database, and returns a successful acknowledgement.

  ---

  Phase 3: Evaluation Service & LLM Integration
  Focus: Implementing the business logic that connects the submission to the evaluation pipeline.

   * Actions:
       1. Develop evaluation_service.py to:
           * Load necessary context (incident metadata, files).
           * Build the prompt dynamically.
           * Call the LLMProvider (integration with OpenRouter).
       2. Implement the deterministic pass/fail logic in the backend using the parsed structured response.
       3. Save the llm_evaluation record (raw + parsed) linked to the attempt.
       4. Update the endpoint to return the actual pass/fail result to the user.
  Validation Plan (Per Phase)
   * Phase 1: Unit test Pydantic schemas against sample LLM JSON outputs.
   * Phase 2: Manual/Automated tests to verify data in DB matches API payload.
   * Phase 3: Full integration test with an incident to verify end-to-end flow, including prompt construction and pass/fail logic.
