# Repository & Setup Guide

## Repository Structure (`/`)
- `/frontend` (Next.js App)
- `/backend` (FastAPI App)
- `/docs` (Design Documents)
- `README.md` (Project root)

## Local Setup Checklist

### 1. Prerequisites
- [ ] Node.js (v18+)
- [ ] Python (v3.9+)
- [ ] PostgreSQL (Local or Supabase connection string)

### 2. Environment Variables
Create `.env` in backend:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/careconnect"
SECRET_KEY="your-secret-key-for-jwt"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows)
4. `pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary passlib[bcrypt] python-jose[cryptography]`
5. Run migrations (or load schema): `psql -d careconnect -f ../docs/database_schema.sql`
6. Run server: `uvicorn main:app --reload`

### 4. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### 5. Common Fixes
- **Port Conflicts**: Backend defaults to 8000, Frontend to 3000. If busy, use `uvicorn --port 8001` or `npm run dev -- -p 3001`.
- **CORS Errors**: Ensure Backend `main.py` has `CORSMiddleware` allowing `http://localhost:3000`.
