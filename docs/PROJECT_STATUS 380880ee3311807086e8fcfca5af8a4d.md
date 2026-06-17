# PROJECT_STATUS

Current Version: V1

Current Sprint: Sprint 2

Completed:

✦ Based on the Sprint Plans, PROJECT_STATUS, and V1 Architecture documents, here is the official assessment of our progress in Sprint 2: Incident Engine.

  Current Progress:
   - [x] Create 3-5 sample incidents: DONE. We have 5 incidents (fastapi-001 to fastapi-005) with injected bugs, standardized root_cause types, and non-revealing titles.
   - [ ] Implement Incident Loaders: NOT STARTED. backend/src/incident_engine/loader.py is empty.
   - [ ] Implement Endpoints: NOT STARTED. The routes do not exist yet.

  ---

  Remaining Work for Sprint 2:

  1. Incident Engine Implementation (The "Brain")
  As per the V1 Architecture, we must transform "Filesystem → Python Objects".
   - Tasks:
       - Create Pydantic schemas in backend/src/schemas/incident_schema.py to match our public.json and private.json structure.
       - Implement loader.py to:
           - Scan the incidents/ directory.
           - Load and parse public.json and private.json.
           - Read the contents of the broken/ and golden/ folders.

  2. API Endpoints (The "Interface")
  As per the Sprint Plans, we need two specific routes.
   - Tasks:
       - Create backend/src/api/v1/incidents.py.
       - GET /api/v1/incidents/current: Should return the current incident metadata and files for the logged-in user.
       - POST /api/v1/incidents/{incident_id}/hint: Should return a hint based on the requested level and track usage (as per the hint_usage table in the database).

  ---

  Proposed Execution Plan:

  Phase 1: Schemas (The Contract)
   - Define IncidentPublic, IncidentPrivate, and IncidentFile Pydantic models. This ensures the loader and the API speak the same language.

  Phase 2: Loader (The Engine)
   - Code the IncidentLoader class in backend/src/incident_engine/loader.py. It will handle all the os.path and json.load logic to make the incidents available as Python
     objects.

  Phase 3: Router (The Delivery)
   - Wire up the endpoints in a new incidents.py router and include it in src/api/router.py.

  Shall we begin Phase 1 by creating the Pydantic schemas? I will base them exactly on the JSON structure we just finalized for the 5 incidents.

