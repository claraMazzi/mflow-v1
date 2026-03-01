# Integration tests (Black Box / Sandbox)

These tests exercise the **public HTTP API** with **real requests** (Supertest) and a **real MongoDB** instance. No mocks are used for persistence so that queries and document relationships behave like in production.

- **Version creation**: `version-create.integration.test.ts` — POST /api/versions (blank and from parent).
- **Version finalize**: `version-finalize.integration.test.ts` — POST /api/versions/:versionId/finalize (validation and state update).

## Requirements

- **MongoDB** must be running and reachable (e.g. local or a dedicated test instance).
- Configure via environment (e.g. `.env` or `.env.test`):
  - `MONGO_URL` – connection string (e.g. `mongodb://localhost:27017/`)
  - `MONGO_DB_NAME` or `MONGO_DB_NAME_TEST` – database name (defaults to `MFLOW_TEST` so dev data is not used).

## Run

```bash
# All tests
npm test

# Only version-creation integration tests
npm run test:integration
```
