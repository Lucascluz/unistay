# Render Deployment Guide - UniStay Backend

## Issues Fixed

### ✅ Problem: Invalid Node.js Version
**Error**: `Invalid node version specification 'node_modules'`
**Cause**: `.nvmrc` file contained "node_modules" instead of a valid Node.js version
**Fix**: Updated `.nvmrc` to specify Node.js 20

### Changes Made:
1. **`.nvmrc`**: Changed from "node_modules" to "20"
2. **`package.json`**: Added `engines` field specifying Node.js >= 20.0.0
3. **`render.yaml`**: Created Render configuration file

---

## Deployment Steps

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Lucascluz/unistay`
   - Select the repository

3. **Configure Service**
   - **Name**: `unistay-backend`
   - **Region**: Choose closest to your users (or same as Neon DB: Europe West)
   - **Branch**: `master`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npm run migrate`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid if needed)

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://neondb_owner:npg_wUojM9OTa8IC@ep-soft-surf-abbbevvu-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=my-secret-key-changed-for-production
   JWT_EXPIRES_IN=7d
   RESEND=re_BBWXpnsT_J9WccBP8NeRxFvysmhnoC7yY
   ADMIN_SECRET_KEY=my-admin-secret-key-changeed-for-production
   FROM_EMAIL=noreply@unistay.me
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```
   
   **Important**: Update `FRONTEND_URL` with your actual Netlify URL after deploying frontend!

5. **Create Web Service**
   - Click "Create Web Service"
   - Render will automatically deploy your backend

### Option 2: Deploy via render.yaml (Blueprint)

If you've committed the `render.yaml` file:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect repository: `Lucascluz/unistay`
4. Render will detect `render.yaml` and configure automatically
5. Add the environment variables marked as `sync: false` manually in the dashboard

---

## Important Configuration Notes

### Root Directory
**CRITICAL**: Render must be configured with `backend` as the root directory since your repo structure is:
```
/unistay
  ├── backend/     ← Deploy this
  └── frontend/
```

### Build Command
The build command does three things:
1. `npm install` - Install dependencies
2. `npm run build` - Compile TypeScript to JavaScript
3. `npm run migrate` - Run database migrations on deployment

### Environment Variables Priority
**Must be set manually in Render dashboard**:
- `DATABASE_URL` - Your Neon connection string
- `JWT_SECRET` - Your JWT secret key
- `RESEND` - Your Resend API key
- `ADMIN_SECRET_KEY` - Your admin secret
- `FRONTEND_URL` - Your Netlify URL (update after frontend deployment)

---

## Post-Deployment Checklist

### 1. Update CORS Settings
Your backend will be deployed at: `https://unistay-backend.onrender.com`

Make sure your `src/index.ts` has proper CORS configuration:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-netlify-app.netlify.app', // Add your Netlify URL
  ],
  credentials: true,
}));
```

### 2. Update Frontend Environment Variable
In Netlify, set:
```
VITE_API_URL=https://unistay-backend.onrender.com
```

### 3. Update Backend FRONTEND_URL
In Render, update:
```
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### 4. Test API Endpoints
Once deployed, test your API:
```bash
curl https://unistay-backend.onrender.com/health
```

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `Root Directory` is set to `backend`
- Verify all dependencies are in `package.json`

### Database Connection Fails
- Verify `DATABASE_URL` environment variable is correct
- Ensure Neon database is accessible (check firewall settings)
- Check SSL configuration in `src/db/config.ts`

### Migrations Don't Run
- Check build logs for migration output
- Manually run migrations via Render shell:
  ```bash
  npm run migrate
  ```

### Free Tier Sleep
Render's free tier sleeps after 15 minutes of inactivity:
- First request after sleep takes ~30-60 seconds
- Consider using a paid plan or uptime monitor for production

---

## Cost Optimization

### Free Tier Limits
- **750 hours/month** of running time (enough for 1 service)
- Sleeps after 15 minutes of inactivity
- Slower build times
- **No automatic builds** from Git pushes after free limit

### Upgrading
If you need to upgrade:
- **Starter Plan**: $7/month - No sleep, faster builds
- **Standard Plan**: $25/month - More resources, auto-scaling

---

## Architecture Overview

```
Frontend (Netlify)          Backend (Render)         Database (Neon)
    ↓                            ↓                        ↓
Static SPA         →       Express.js API      →     PostgreSQL
VITE_API_URL              NODE_ENV=production       DATABASE_URL
                          JWT, CORS, etc.           SSL Required
```

---

## Quick Reference

**Backend URL (after deployment)**: 
`https://unistay-backend.onrender.com`

**Health Check Endpoint**: 
`https://unistay-backend.onrender.com/health`

**Deployment Trigger**: 
Push to `master` branch (auto-deploy enabled by default)

---

## Next Steps After Deployment

1. ✅ Verify backend is running: Check the Render dashboard
2. ✅ Test API endpoints with curl or Postman
3. ✅ Update Netlify `VITE_API_URL` environment variable
4. ✅ Update Render `FRONTEND_URL` environment variable
5. ✅ Test full integration between frontend and backend
6. ✅ Set up monitoring/logging (optional but recommended)

---

Your backend is now ready to deploy! 🚀
