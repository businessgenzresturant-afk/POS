# Database Connection Pool Exhaustion Fix

**Date:** June 24, 2026  
**Error:** `FATAL: (EMAXCONNSESSION) max clients reached in session mode`  
**Status:** 🔴 CRITICAL - IMMEDIATE ACTION REQUIRED

---

## 🚨 Critical Issue

**Error Message:**
```
max clients reached in session mode - max clients are limited to pool_size: 15
```

**What's Happening:**
- Neon PostgreSQL free tier limits: **15 concurrent connections**
- Each API request creates a new Prisma client connection
- Connections not being properly released
- Pool exhausted → All API requests fail

**Affected APIs:**
- ❌ `/api/admin/check-users`
- ❌ `/api/tables`
- ❌ `/api/orders`
- ❌ `/api/bills`
- ❌ All database queries

---

## 🔍 Root Cause

### 1. Missing Connection Pool Configuration

**Current DATABASE_URL (Neon):**
```
postgresql://user:password@host/db
```

**Problem:** No connection limit specified

**Serverless Issue:**
- Vercel creates new instance per request
- Each instance creates new Prisma client
- Connections accumulate and never close
- Neon session mode limit: 15 connections

### 2. Neon Connection Modes

Neon has TWO connection modes:

**Session Mode (Port 5432):**
- Direct PostgreSQL connection
- Limit: 15 concurrent connections (free tier)
- Problem: Serverless functions exceed this quickly

**Pooled Mode (Port 6543 with pgbouncer):**
- Connection pooling via PgBouncer
- Higher connection limit
- Recommended for serverless

---

## ✅ Solution

### Option 1: Use Neon Pooled Connection (RECOMMENDED)

Update `DATABASE_URL` in Vercel environment variables:

**From:**
```
postgresql://user:password@ep-xxx.region.neon.tech/neondb
```

**To:**
```
postgresql://user:password@ep-xxx.region.neon.tech/neondb?pgbouncer=true&connect_timeout=10&pool_timeout=10&connection_limit=1
```

**Parameters Explained:**
- `pgbouncer=true` - Use connection pooling
- `connect_timeout=10` - Connection timeout (seconds)
- `pool_timeout=10` - Pool acquisition timeout (seconds)
- `connection_limit=1` - Max 1 connection per Prisma client

### Option 2: Add Connection Parameters to Existing URL

If using Neon, add these query parameters:

```bash
?sslmode=require&pgbouncer=true&connection_limit=1
```

### Option 3: Use Neon with Pooler Endpoint

Get the **Pooler endpoint** from Neon dashboard:

1. Go to Neon Dashboard
2. Select your database
3. Copy "Pooled connection" URL (port 6543)
4. Add to Vercel as `DATABASE_URL`

Example:
```
postgresql://user:password@ep-xxx-pooler.region.neon.tech:6543/neondb?sslmode=require
```

---

## 🚀 Immediate Fix Steps

### Step 1: Update Vercel Environment Variables

```bash
# Go to Vercel Dashboard
1. Open: https://vercel.com/raghavshah/genz-restaurant-pos
2. Navigate to: Settings → Environment Variables
3. Find: DATABASE_URL
4. Update value with pooled connection string
5. Save changes
```

### Step 2: Get Correct Connection String from Neon

```bash
# Login to Neon
1. Go to: https://console.neon.tech
2. Select your project: "genz-restaurant-pos"
3. Click: "Connection Details"
4. Select: "Pooled connection"
5. Copy the URL (should include port 6543 or pgbouncer=true)
```

### Step 3: Redeploy

```bash
# Trigger redeployment in Vercel
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
   OR
4. Push any commit to trigger auto-deploy
```

---

## 🔧 Code Changes Made

### File: `src/lib/prisma.ts`

**Before:**
```typescript
export const prisma = globalForPrisma.prisma || new PrismaClient();
```

**After:**
```typescript
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

// Graceful shutdown in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
```

**Changes:**
- Added logging configuration
- Added graceful shutdown handler
- Ensures proper connection cleanup

---

## 📋 Verification Steps

### Test 1: Check Current Connection String

```bash
# In Vercel Dashboard → Environment Variables
DATABASE_URL = ?

# Should contain ONE of:
✅ pgbouncer=true
✅ port :6543 (pooler endpoint)
✅ connection_limit=1

# Should NOT be:
❌ port :5432 without pooling parameters
❌ Direct connection without limits
```

### Test 2: Test API After Fix

```bash
# Test user check endpoint
curl https://pos.gen-z.online/api/admin/check-users

# Expected: JSON response with users
# Should NOT: "max clients reached" error
```

### Test 3: Monitor Connection Count

```bash
# In Neon Dashboard
1. Go to Monitoring
2. Check "Active Connections"
3. Should stay under 15 (ideally under 5)
```

---

## 🎯 Recommended DATABASE_URL Format

### For Neon PostgreSQL:

```bash
# Pooled connection (RECOMMENDED)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.neon.tech:6543/neondb?sslmode=require"

# OR with pgbouncer parameter
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.neon.tech/neondb?pgbouncer=true&connection_limit=1&sslmode=require"
```

### Connection String Anatomy:

```
postgresql://
  USER:PASSWORD          ← Your credentials
  @ep-xxx-pooler...      ← Pooler endpoint (important!)
  :6543                  ← Pooler port (not 5432)
  /neondb                ← Database name
  ?sslmode=require       ← SSL required
  &connection_limit=1    ← Max 1 connection per client
```

---

## 🔒 Security Notes

**⚠️ NEVER commit DATABASE_URL to git!**

Current setup is correct:
- ✅ `.env` in `.gitignore`
- ✅ `.env.local` in `.gitignore`
- ✅ Only `.env.example` in git (no real credentials)

**Where to Store:**
- ✅ Vercel Dashboard → Environment Variables (production)
- ✅ Local `.env` file (development)
- ❌ NEVER in code or git

---

## 📊 Connection Limits by Provider

| Provider | Free Tier Limit | Pooled Limit | Port |
|----------|----------------|--------------|------|
| Neon | 15 (session mode) | 100+ (pooled) | 6543 |
| Supabase | 15 (direct) | 200 (pooled) | 6543 |
| Railway | 20 | N/A | 5432 |
| Render | 100 | N/A | 5432 |

**Current:** Neon (session mode) - 15 connections  
**Needed:** Neon (pooled mode) - 100+ connections

---

## 🐛 Troubleshooting

### Issue: Still getting max clients error after fix

**Check:**
```bash
1. Verify DATABASE_URL updated in Vercel
2. Redeploy triggered (not just save)
3. New deployment using new env var
4. Clear any cached connections in Neon
5. Check Neon dashboard for active connections
```

**Solution:**
```bash
# Force new deployment
1. Go to Vercel
2. Deployments → Latest → "..." → Redeploy
3. Check "Use existing build cache" is UNCHECKED
4. Confirm redeploy
```

### Issue: Connection string not working

**Verify Format:**
```bash
# Must have:
✅ postgresql:// (not postgres://)
✅ Correct username and password
✅ @ep-xxx... (endpoint)
✅ /neondb (database name)
✅ ?sslmode=require (SSL parameter)

# Check by testing locally:
DATABASE_URL="your-connection-string" npm run build
```

### Issue: "P1000: Authentication failed"

**Cause:** Wrong credentials in connection string

**Solution:**
1. Go to Neon Dashboard
2. Reset password if needed
3. Copy fresh connection string
4. Update Vercel environment variables

### Issue: "P1001: Can't reach database server"

**Cause:** Wrong endpoint or network issue

**Solution:**
1. Verify endpoint URL from Neon
2. Check if pooler endpoint used (6543)
3. Verify SSL mode set to "require"
4. Check Neon database is not suspended

---

## 📈 Monitoring

### Check Connection Usage

**Neon Dashboard:**
```
1. Login to Neon
2. Select project
3. Go to "Monitoring" tab
4. Check "Active connections" graph
5. Should see < 5 connections normally
```

**Vercel Logs:**
```
1. Go to Vercel Dashboard
2. Select deployment
3. Click "Functions" tab
4. Check for connection errors
5. Look for "EMAXCONNSESSION" errors
```

### Set Up Alerts

**In Neon:**
1. Go to Settings
2. Enable email notifications
3. Set threshold: 10 connections
4. Get alerted before limit hit

---

## 🚀 Migration Checklist

- [ ] Get pooled connection string from Neon
- [ ] Verify it includes `:6543` or `pgbouncer=true`
- [ ] Update `DATABASE_URL` in Vercel env vars
- [ ] Update `DATABASE_URL` in local `.env` (optional)
- [ ] Trigger Vercel redeployment
- [ ] Test `/api/admin/check-users` endpoint
- [ ] Test `/api/tables` endpoint
- [ ] Monitor connection count in Neon
- [ ] Verify no more "max clients" errors
- [ ] Update team documentation

---

## 📝 Example Correct Configuration

### Vercel Environment Variables

```bash
# Production
DATABASE_URL="postgresql://neondb_owner:XXX@ep-xxx-pooler.us-east-2.aws.neon.tech:6543/neondb?sslmode=require"

NEXTAUTH_URL="https://pos.gen-z.online"
NEXTAUTH_SECRET="your-production-secret"
TAX_RATE="0.18"
```

### Local .env File

```bash
# Development (can use same pooled connection)
DATABASE_URL="postgresql://neondb_owner:XXX@ep-xxx-pooler.us-east-2.aws.neon.tech:6543/neondb?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret"
TAX_RATE="0.18"
```

---

## ✅ Success Criteria

After implementing the fix:

- ✅ `/api/admin/check-users` returns JSON (not error)
- ✅ Dashboard loads all tables
- ✅ Orders can be created
- ✅ Bills can be generated
- ✅ Neon connections stay under 10
- ✅ No "max clients" errors in logs
- ✅ All API endpoints working

---

## 🎓 Lessons Learned

1. **Serverless needs connection pooling** - Each function instance needs its own connection
2. **Free tier limits matter** - 15 connections exhausted quickly in production
3. **Use pooler endpoints** - Neon/Supabase provide pooling built-in
4. **Monitor connection usage** - Set up alerts before hitting limits
5. **Test with load** - Production traffic reveals connection issues

---

## 📞 Support

**Neon Support:**
- Docs: https://neon.tech/docs/connect/connection-pooling
- Discord: https://discord.gg/neon
- Email: support@neon.tech

**Vercel Support:**
- Docs: https://vercel.com/docs/storage/vercel-postgres
- Discord: https://vercel.com/discord
- Help: help@vercel.com

---

**Issue Created:** June 24, 2026  
**Priority:** 🔴 CRITICAL  
**Status:** 🔧 FIX READY - NEEDS DEPLOYMENT  
**Action Required:** Update DATABASE_URL in Vercel
