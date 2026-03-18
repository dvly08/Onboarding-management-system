# Global Support Contractor Onboarding

This repo now contains a lightweight full-stack onboarding app built from the contractor guide, manager checklist, and onboarding structure docs in this workspace.

## What changed

- The old browser-only prototype has been replaced with a shared contractor/manager experience backed by a real API.
- Onboarding records are persisted in SQLite so manager and contractor views stay in sync.
- The app now exposes:
  - phase-based onboarding progress
  - editable task completion
  - manager-controlled access bundle status
  - month 1-3 ramp targets
  - workflow expectations and internal resource references

## Project structure

- `server.py` - local entrypoint that serves the API and frontend
- `backend/`
  - `seed_data.py` - onboarding phases, tasks, access bundles, metrics, expectations, and demo hints
  - `repository.py` - SQLite persistence layer
  - `service.py` - record/session/task/access business logic
  - `http_app.py` - HTTP routing and static file serving
- `data/onboarding.db` - created automatically on first run
- `onboarding-portal/`
  - `index.html` - dashboard shell
  - `style.css` - responsive UI styling
  - `app.js` - API-driven frontend logic
- `tests/test_service.py` - backend smoke tests

## Run locally

The environment only needs Python 3.

1. From the repo root, start the server:

   ```bash
   python3 server.py
   ```

2. Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

3. Use one of the demo combinations or create your own:
   - Contractor view: `jamie.contractor@demo.handshake`
   - Manager view: `ashley.manager@demo.handshake` managing `jamie.contractor@demo.handshake`

## Test

Run the backend tests with:

```bash
python3 -m unittest discover -s tests
```
