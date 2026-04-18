   # Task Flow CapStone Project

## Deployment to Render

1. Push all changes to GitHub main branch.
2. Render will auto-deploy:
   - npm install (root)
   - npm start (cd backend && node server.js)
3. Backend serves API at /api/* and frontend at / (SPA routing).

## Deployment to Vercel

1. In Vercel dashboard, set Root Directory: `frontend`
2. Framework Preset: Vite
3. Install Command: `npm ci`
4. Build Command: `npx vite build`
5. Output Dir: `dist`

## Local Development Frontend

1. `npm ci`
2. `npm run build`
3. `npm start` (backend on 5000, visit http://localhost:5000 for app)

## Local Development Backend

1. `npm install`
2. `npm run dev`