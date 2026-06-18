# AI Engineering Incident Simulator - Project Instructions

This document serves as the foundational mandate for all AI agent operations within this repository. Adherence to these instructions is mandatory.

## 🎯 Core Philosophy: Documentation as Truth
The `docs/` folder is the **absolute source of truth** for this project.
- **Architectural Decisions:** Refer to `docs/ADRs/`.
- **Roadmap & Scope:** Refer to `docs/Sprint Plans.md` and `docs/Roadmap.md`.
- **Status:** Refer to `docs/PROJECT_STATUS.md`.
- **Decision Logic:** Any technical or architectural decision MUST be validated against existing documentation. If a conflict arises or a new decision is needed, it must be documented in a new ADR before implementation.
- **Scope Creep:** Strictly follow the "What NOT To Build During V1" section in `docs/Sprint Plans.md`.

## 🏗️ Architectural Overview
- **Backend:** FastAPI (Python 3.12+)
- **Database:** PostgreSQL with SQLAlchemy (async) and Alembic for migrations.
- **Authentication:** JWT-based middleware with bcrypt password hashing.
- **Incident Engine:** A disk-based loader that serves broken code scenarios to the frontend and evaluates fixes via LLM.

## 🛠️ Tech Stack & Conventions
- **Pydantic V2:** Use for all request/response schemas and internal data validation.
- **SQLAlchemy 2.0:** Use the Declarative Mapping style.
- **Repository Pattern:** Logic for database access should be encapsulated in `src/repositories/`.
- **Service Layer:** Business logic resides in `src/services/`.
- **Migrations:** Never modify the database schema without an Alembic migration.

## 🔄 Workflow Requirements
1. **Research First:** Before any code change, verify the current state and relevant documentation.
2. **Strategy:** Propose a plan that aligns with the current Sprint goals.
3. **Execution:** Surgical edits using `replace` whenever possible.
4. **Validation:** All changes must be verified (tests or manual API checks if tests aren't available yet).

## 📁 Key Directories
- `backend/src/api/`: API Routers and versioning (v1).
- `backend/src/models/`: SQLAlchemy database models.
- `backend/src/schemas/`: Pydantic schemas.
- `backend/src/incident_engine/`: Logic for loading and managing incidents.
- `incidents/`: The raw data for simulation scenarios.

---
*Last Updated: June 18, 2026*
