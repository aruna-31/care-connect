# Deployment Plan

## 1. Domain & SSL
- **Domain**: Purchase `doctor-patient-app.com` (example) via Namecheap/Route53.
- **SSL**: Free via Let's Encrypt (managed automatically by most PaaS/load balancers).

## 2. Frontend Hosting (Vercel / Netlify)
*Recommended: Vercel for Next.js/Vite apps.*
- **Setup**: Connect GitHub repo.
- **Build Settings**:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://api.doctor-patient-app.com`

## 3. Backend Hosting (Railway / Render / AWS App Runner)
*Recommended: Railway or Render for simplicity.*
- **Setup**: Connect GitHub repo (monorepo settings: Root Directory = `backend`).
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: `PORT` (provided by platform)
  - `DATABASE_URL`: (from Database step)
  - `JWT_SECRET`: (Generate a strong random string)
  - `CORS_ORIGIN`: `https://doctor-patient-app.com`
  - `NODE_ENV`: `production`

## 4. Database Hosting (Railway / Supabase / AWS RDS)
*Recommended: Railway (if using for backend) or Supabase (managed Postgres).*
- **Setup**: Provision PostgreSQL instance.
- **Connections**:
  - Copy `DATABASE_URL` to Backend environment variables.
- **Backups**: Enable daily automated backups.

## 5. Secrets Management
- **Development**: Use `.env` file (gitignored).
- **Production**: Use platform-native secret management (Vercel Env Vars, Railway Variables).
- **Sensitive Keys**: API keys, DB passwords, JWT secrets.

## 6. Deployment Workflow
1. Push to `main` branch.
2. CI Pipeline runs tests.
3. If passed, Vercel auto-deploys Frontend.
4. Railway/Render auto-deploys Backend.
5. Database migrations: Run manually or via init script on deployment (carefully).
