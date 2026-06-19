# Vercel Deployment Instructions

## Important: Environment Variables Setup

⚠️ **CRITICAL:** Before deploying, you MUST set these environment variables in Vercel Dashboard:

### Required Environment Variables:

1. **NEXTAUTH_SECRET** (Security - REQUIRED)
   ```
   7sl+ZpEQy+8/+/XPFW1ZjV3W4g3MsvVcI5FKgrXwoR0=
   ```

2. **DATABASE_URL** (Supabase Connection Pooling)
   ```
   Get from: Supabase Dashboard → Settings → Database → Connection Pooling
   Format: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

3. **DIRECT_URL** (Supabase Direct Connection)
   ```
   Get from: Supabase Dashboard → Settings → Database → Direct Connection
   Format: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```

4. **NEXTAUTH_URL** (Your Vercel Deployment URL)
   ```
   Format: https://your-app-name.vercel.app
   Note: Update this AFTER first deployment with your actual Vercel URL
   ```

---

## How to Set Environment Variables in Vercel:

### Method 1: Via Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/your-team/your-project/settings/environment-variables
2. Click **"Add New"**
3. Enter Variable Name (e.g., `NEXTAUTH_SECRET`)
4. Enter Value
5. Select Environment: **Production** ✅ (and Preview/Development if needed)
6. Click **Save**

### Method 2: Via Vercel CLI
```bash
vercel env add NEXTAUTH_SECRET production
# Then paste the value when prompted
```

---

## Deployment Steps:

### 1. Make sure all environment variables are set in Vercel Dashboard

### 2. Push to GitHub:
```bash
git add .
git commit -m "Add deployment configuration"
git push origin master
```

### 3. Vercel will automatically deploy from GitHub

### 4. After deployment, update NEXTAUTH_URL:
- Get your deployment URL (e.g., `https://pos-abc123.vercel.app`)
- Go back to Vercel Environment Variables
- Update `NEXTAUTH_URL` with your actual URL

---

## Troubleshooting:

### Error: "NEXTAUTH_SECRET environment variable is not set"
**Solution:** Add `NEXTAUTH_SECRET` in Vercel Dashboard → Environment Variables

### Error: "Can't reach database server"
**Solution:** 
1. Check if `DATABASE_URL` and `DIRECT_URL` are correct
2. Verify Supabase database is running
3. Check Supabase connection strings in Supabase Dashboard

### Error: "Invalid callback URL"
**Solution:** Update `NEXTAUTH_URL` with your actual Vercel deployment URL

---

## Quick Links:

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com/
- **GitHub Repository:** https://github.com/businessgenzresturant-afk/POS

---

## Support:

If you face any issues, check:
1. All environment variables are set correctly in Vercel
2. GitHub repository is properly connected to Vercel
3. Build logs in Vercel Deployment Dashboard
