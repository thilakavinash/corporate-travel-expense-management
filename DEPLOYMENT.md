# Vercel Deployment Guide

## Corporate Travel & Expense Management System

This guide explains how to deploy the MERN-stack Corporate Travel & Expense Management System to Vercel.

---

## 🚨 CRITICAL SECURITY WARNING

**Your MongoDB Atlas credentials and JWT secret are currently exposed in `server/.env`.**

You must rotate these credentials immediately before deployment:

1. **MongoDB Atlas**: Change the database user password in your Atlas dashboard
2. **JWT Secret**: Generate a new random secret (use `openssl rand -base64 32`)
3. **Remove from Git**: The `.env` file should never be committed. Remove it from Git history if possible.

---

## Architecture Overview

The application is deployed as two separate Vercel projects:

1. **Frontend**: React + Vite SPA (root directory: `client`)
2. **Backend**: Express.js API with Vercel Serverless Functions (root directory: `server`)

### Data Flow

```
Frontend (Vercel) → Backend API (Vercel Serverless) → MongoDB Atlas
                                       ↓
                                 Cloudinary (receipts)
```

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: [thilakavinash/corporate-travel-expense-management](https://github.com/thilakavinash/corporate-travel-expense-management.git)
3. **MongoDB Atlas**: Free tier database
4. **Cloudinary Account**: Free tier for receipt uploads

---

## Step 1: Rotate Credentials (Do This First!)

### MongoDB Atlas

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com)
2. Navigate to Database Access
3. Find user `thilakavinash482_db_user`
4. Click "Edit" and change the password
5. Update the connection string in your `.env` file

### JWT Secret

Generate a new secure secret:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Update `server/.env` with the new `JWT_SECRET`.

---

## Step 2: Cloudinary Setup (For Receipt Uploads)

Vercel's serverless filesystem is ephemeral. Receipt uploads must use Cloudinary.

### Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Go to Dashboard → Settings → API Security
3. Note down:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Configure Cloudinary Folder

1. Create a folder named `expense-receipts` in your Cloudinary Media Library
2. This is where uploaded receipts will be stored

---

## Step 3: Deploy Backend to Vercel

### 3.1 Create Vercel Project for Backend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Root Directory**: Select `server`
5. Click "Continue"

### 3.2 Configure Backend Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | Your Atlas connection string | MongoDB Atlas connection |
| `JWT_SECRET` | Your new JWT secret | JWT signing key |
| `JWT_EXPIRE` | `7d` | Token expiration |
| `NODE_ENV` | `production` | Environment |
| `FRONTEND_URL` | Your frontend Vercel URL (after deployment) | CORS origin |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Cloudinary config |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Cloudinary config |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Cloudinary config |

**Important**: Set `MONGODB_URI`, `JWT_SECRET`, and Cloudinary credentials in all environments (Production, Preview, Development).

### 3.3 Deploy Backend

1. Click "Deploy"
2. Wait for build to complete
3. Note the backend URL (e.g., `https://your-backend.vercel.app`)
4. Test the health endpoint: `https://your-backend.vercel.app/api/health`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Project for Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Root Directory**: Select `client`
5. Click "Continue"

### 4.2 Configure Frontend Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | Your backend Vercel URL with `/api` suffix | Backend API base URL |
| `VITE_API_DEBUG` | `false` | Disable debug logging in production |

**Example**: If your backend is `https://your-backend.vercel.app`, set:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

### 4.3 Deploy Frontend

1. Click "Deploy"
2. Wait for build to complete
3. Note the frontend URL (e.g., `https://your-frontend.vercel.app`)

### 4.4 Update Backend CORS

Go back to your backend Vercel project settings → Environment Variables:

1. Update `FRONTEND_URL` to your deployed frontend URL
2. Redeploy the backend (this is required for CORS to work)

---

## Step 5: Verify Deployment

### 5.1 Test Backend Health

```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Corporate Travel & Expense Management API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5.2 Test Frontend

1. Open your frontend URL in a browser
2. Try logging in with a seeded account:
   - Employee: `john.employee@company.com` / `password123`
   - Manager: `jane.manager@company.com` / `password123`
   - Finance: `bob.finance@company.com` / `password123`
   - Admin: `alice.admin@company.com` / `password123`

### 5.3 Test Receipt Upload

1. Log in as an employee
2. Create a travel request (if none exists)
3. Add an expense with a receipt upload
4. Verify the receipt is uploaded to Cloudinary
5. Check the Cloudinary Media Library → `expense-receipts` folder

### 5.4 Test All Roles

Test each role's key functionality:

- **Employee**: Create travel request, add expense, create reimbursement
- **Manager**: Approve/reject travel requests
- **Finance**: Approve/reject expenses, process reimbursements
- **Admin**: View analytics, user management, audit logs

---

## Files Changed for Deployment

### Frontend (`client/`)

- `vercel.json` - SPA routing configuration
- `.env.example` - Updated with production API URL documentation

### Backend (`server/`)

- `server.js` - Adapted for Vercel serverless (exports app, conditional `app.listen`)
- `api/index.js` - Vercel serverless entry point
- `vercel.json` - Vercel build and route configuration
- `config/db.js` - MongoDB connection pooling for serverless
- `middleware/uploadMiddleware.js` - Cloudinary integration with local fallback
- `controllers/expenseController.js` - Updated to handle Cloudinary URLs
- `package.json` - Added Cloudinary dependencies
- `.env.example` - Added Cloudinary and CORS configuration

### Root

- `.gitignore` - Updated to prevent future credential commits

---

## Environment Variables Reference

### Backend (server/.env)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (client/.env)

```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_API_DEBUG=false
```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `FRONTEND_URL` in backend environment variables matches your frontend URL exactly
2. Ensure you redeployed the backend after updating `FRONTEND_URL`
3. Check the browser's Network tab to see the actual request origin

### MongoDB Connection Timeout

If the backend fails to connect to MongoDB:

1. Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for Vercel)
2. Check that `MONGODB_URI` is correctly set in Vercel environment variables
3. Ensure MongoDB Atlas cluster is in the same region as Vercel for lower latency

### Receipt Uploads Fail

If receipt uploads fail:

1. Verify Cloudinary credentials are set in backend environment variables
2. Check Cloudinary API Security settings
3. Ensure the `expense-receipts` folder exists in Cloudinary
4. Check Vercel function logs for specific error messages

### 404 on Nested Routes

If refreshing a page like `/dashboard` shows 404:

1. Verify `client/vercel.json` exists and has the rewrites configuration
2. Redeploy the frontend

### Builds Fail

If the Vercel build fails:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (Vercel uses Node.js 18.x by default)

---

## Post-Deployment Maintenance

### Monitor Logs

Check Vercel function logs regularly for errors:
- Vercel Dashboard → Your Backend Project → Functions → `api/index.js`

### Database Backups

Enable automated backups in MongoDB Atlas:
- Atlas Console → Backup → Configure Backup Policy

### Cloudinary Limits

Monitor Cloudinary storage usage:
- Cloudinary Dashboard → Media Library
- Free tier: 25GB storage, 25GB bandwidth/month

### Security

- Rotate JWT secrets periodically
- Review MongoDB Atlas IP whitelist
- Enable MongoDB Atlas data encryption
- Review Cloudinary API access settings

---

## Local Development After Deployment

To continue local development after deployment:

### Backend

```bash
cd server
# Use local .env (not committed to Git)
npm start
```

### Frontend

```bash
cd client
# VITE_API_URL will default to localhost:5000/api if not set
npm run dev
```

---

## Support

For issues with:
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **MongoDB Atlas**: [Atlas Documentation](https://docs.atlas.mongodb.com)
- **Cloudinary**: [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## Deployment Checklist

- [ ] Rotated MongoDB Atlas credentials
- [ ] Generated new JWT secret
- [ ] Created Cloudinary account
- [ ] Configured Cloudinary folder
- [ ] Deployed backend to Vercel
- [ ] Configured backend environment variables
- [ ] Tested backend health endpoint
- [ ] Deployed frontend to Vercel
- [ ] Configured frontend environment variables
- [ ] Updated backend CORS with frontend URL
- [ ] Redeployed backend with CORS update
- [ ] Tested login for all four roles
- [ ] Tested receipt upload to Cloudinary
- [ ] Tested travel request creation and approval
- [ ] Tested expense creation and approval
- [ ] Tested reimbursement creation and payment
- [ ] Verified analytics and reports
- [ ] Verified audit logs
- [ ] Removed old credentials from Git history
