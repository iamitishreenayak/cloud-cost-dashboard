# Cloud Cost Optimization Dashboard

Standalone demo: React (Vite + Recharts) frontend, FastAPI backend, sample billing data in local JSON files.
No database, no cloud-provider SDKs or APIs.

```
cloud-cost-dashboard/
├── backend/   FastAPI app (app/main.py, routes/, services/, models/), data/costs.json, data/budget.json
└── frontend/  React app (src/pages, components, services, styles)
```

## Prerequisites (Windows)
- Python 3.10+ (`python --version` or `py --version`)
- Node.js 18+ (`node --version`)

---

## Run the Backend (PowerShell Window 1)

1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd cloud-cost-dashboard\backend
   ```

2. Create a virtual environment (use `py` or `python`):
   ```powershell
   py -m venv .venv
   ```
   *(or `python -m venv .venv`)*

3. If script execution is restricted on Windows, allow script execution for the current session:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

4. Activate the virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

5. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

6. Start the FastAPI backend server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
   *(or directly `.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000`)*

- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Run the Frontend (PowerShell Window 2)

1. Open a second PowerShell window and navigate to the frontend folder:
   ```powershell
   cd cloud-cost-dashboard\frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser at:
   [http://localhost:5173](http://localhost:5173)

The dashboard will load metrics, budget progress, monthly trends, breakdown charts, and cost records directly from the FastAPI backend.

---

## Environment Configuration

The frontend connects to the backend REST API via the base URL configured in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```
- If running on a different port or host, update `VITE_API_URL` in `frontend/.env`.
- Backend CORS configuration in `backend/app/main.py` permits requests from `http://localhost:5173`, `http://127.0.0.1:5173`, and preview ports.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check (`{"status": "ok"}`) |
| `/api/filters/options` | GET | Available services, projects, teams, and date bounds |
| `/api/summary` | GET | Total spend, current month spend, month-over-month trend, budget, and potential savings |
| `/api/charts/monthly` | GET | Monthly spending trend list (with budget reference line) |
| `/api/charts/breakdown/{dimension}` | GET | Spend breakdown by `service`, `project`, or `team` |
| `/api/costs` | GET | Paginated cost records with query search `q`, sorting (`sort_by`, `order`), and `page`/`page_size` |
| `/api/budget` | GET | Overall and per-team budget status with alert levels; accepts optional `warning` and `critical` (%) query params |
| `/api/suggestions` | GET | Optimization suggestions with affected spend and estimated monthly savings |

Shared query filters across all cost endpoints:
- `start_date` (YYYY-MM-DD)
- `end_date` (YYYY-MM-DD)
- `service` (comma-separated services)
- `project` (comma-separated projects)
- `team` (comma-separated teams)

---

## Customizing Sample Data

- **Budget & Thresholds**: `backend/data/budget.json` (reloaded dynamically without restarting).
- **Billing Records**: `backend/data/costs.json`.
- **Regenerate Billing Records**:
  ```powershell
  cd cloud-cost-dashboard\backend
  python scripts\generate_sample_data.py
  ```
- **Optimization Rules**: Defined in `RULES` inside `backend/app/services/analytics.py`.

---

## Troubleshooting

- **PowerShell `Activate.ps1 cannot be loaded because running scripts is disabled`**:
  Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your PowerShell window, then run `.\.venv\Scripts\Activate.ps1` again.
- **`Python was not found`**:
  Use `py` instead of `python` (the standard Windows Python Launcher), or run `.\.venv\Scripts\python.exe`.
- **Cannot connect to API**:
  Ensure the backend is running in PowerShell Window 1 on port 8000. Test with `curl http://localhost:8000/api/health` or open it in your browser.
