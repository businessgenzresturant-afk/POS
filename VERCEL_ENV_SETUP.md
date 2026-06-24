# 🔧 Vercel Environment Variables Setup

## ❌ REGISTRATION ERROR CAUSE

The "Internal server error" during registration happens because:
1. Database connection failing
2. OR missing/wrong environment variables in Vercel
3. OR user already exists

---

## ✅ SOLUTION: Check Vercel Environment Variables

### Step 1: Open Vercel Dashboard

1. Go to: https://vercel.com
2. Select project: **genz-restaurant-pos**
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

### For Production Environment:

#### 1. DATABASE_URL (CRITICAL ⚠️)
```
Variable Name: DATABASE_URL
Environment: Production
Value: postgresql://username:password@host:port/database?sslmode=require
```

**Example for Supabase:**
```
postgresql://postgres.abcdefgh:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Example for Neon:**
```
postgresql://username:password@ep-xxx.aws.neon.tech/database?sslmode=require
```

**Example for Railway:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

⚠️ **IMPORTANT:** You said "vercel pe sab kuch daala hua hai database password wagera or bhi 4 chize" - Check if this value is correct!

---

#### 2. NEXTAUTH_SECRET (CRITICAL ⚠️)
```
Variable Name: NEXTAUTH_SECRET
Environment: Production
Value: vW8xK3mN9pQ2rT5yU7zA4bC6dE8fG0hJ2kL4mN6pQ8s
```

This MUST be exactly this value for existing sessions to work!

---

#### 3. NEXTAUTH_URL (CRITICAL ⚠️)
```
Variable Name: NEXTAUTH_URL
Environment: Production
Value: https://pos.gen-z.online
```

Make sure NO trailing slash!

---

#### 4. DIRECT_URL (OPTIONAL - Only for migrations)
```
Variable Name: DIRECT_URL
Environment: Production
Value: postgresql://... (direct connection, not pooled)
```

**For Supabase:** Use port 5432 instead of 6543
```
postgresql://postgres.abcdefgh:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

---

## 🔍 VERIFY DATABASE CONNECTION

### Test 1: Check if database is accessible

In Vercel dashboard, check the deployment logs:
1. Go to **Deployments**
2. Click latest deployment
3. Click **Functions** tab
4. Look for any database connection errors

### Test 2: Try to visit seed page

After logging in with `admin@genz.com` / `admin123`:
```
https://pos.gen-z.online/admin/seed
```

If this page loads, database connection is working!

---

## 🐛 COMMON MISTAKES

### Mistake 1: Wrong Connection String Format
❌ Wrong:
```
DATABASE_URL=postgresql://user:pass@host/db
```
✅ Correct (with SSL):
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Mistake 2: Password has special characters
If password contains `@`, `#`, `%`, etc., they need URL encoding:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`

Example:
```
Password: My@Pass#123
Encoded: My%40Pass%23123
```

### Mistake 3: Using localhost in production
❌ Don't use:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/db
```

✅ Use cloud database:
```
DATABASE_URL=postgresql://...@supabase.com:6543/postgres
```

### Mistake 4: Using pooled connection without flag
For Supabase connection pooling, MUST include:
```
?pgbouncer=true&connection_limit=1
```

---

## 🎯 QUICK FIX STEPS

### Step 1: Check Your Database Provider

**Where is your PostgreSQL database?**
- [ ] Supabase
- [ ] Neon
- [ ] Railway
- [ ] Vercel Postgres
- [ ] Other

### Step 2: Get Connection String

#### For Supabase:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **Database**
4. Find "Connection Pooling" section
5. Copy connection string with port **6543** (not 5432)
6. Add: `?pgbouncer=true&connection_limit=1`

#### For Neon:
1. Go to: https://console.neon.tech
2. Select project
3. Go to Dashboard
4. Copy "Connection String" for Prisma
5. It includes `?sslmode=require` automatically

#### For Railway:
1. Go to: https://railway.app/dashboard
2. Select project → PostgreSQL
3. Click **Connect** tab
4. Copy "Prisma" connection string

### Step 3: Update Vercel Environment Variables

1. Go to Vercel project settings
2. Update **DATABASE_URL**
3. Update **NEXTAUTH_URL** to `https://pos.gen-z.online`
4. Update **NEXTAUTH_SECRET** to `vW8xK3mN9pQ2rT5yU7zA4bC6dE8fG0hJ2kL4mN6pQ8s`
5. Click **Save**
6. **IMPORTANT:** Redeploy after saving!

### Step 4: Redeploy

After updating environment variables:
1. Go to **Deployments** tab
2. Click ⋯ menu on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (2-3 minutes)

### Step 5: Test Again

1. Visit: `https://pos.gen-z.online/login`
2. Login with: `admin@genz.com` / `admin123`
3. Visit: `https://pos.gen-z.online/admin/seed`
4. Click "Seed Tables" and "Seed Menu Items"

---

## 🆘 STILL NOT WORKING?

### Get Function Logs:

1. Go to Vercel dashboard
2. **Deployments** → Latest deployment
3. Click **Functions** tab
4. Find `/api/admin/seed-tables`
5. Look for error messages

### Share This Info:

Tell me:
1. **Database provider:** Supabase / Neon / Railway / Other?
2. **Can you login?** Yes with `admin@genz.com`
3. **Environment variables set?** How many variables in Vercel?
4. **Any errors in Vercel logs?** Copy error message

---

## 📝 SUMMARY

**You said: "vercel pe sab kuch daala hua hai database password wagera or bhi 4 chize"**

The 4 environment variables should be:
1. ✅ `DATABASE_URL` - Connection to PostgreSQL
2. ✅ `NEXTAUTH_SECRET` - Session encryption key
3. ✅ `NEXTAUTH_URL` - Your production domain
4. ✅ `DIRECT_URL` - (Optional) Direct database connection

**Check:**
- Is `DATABASE_URL` pointing to correct cloud database?
- Is `NEXTAUTH_URL` exactly `https://pos.gen-z.online` (no trailing slash)?
- Did you redeploy after setting variables?

---

**Most likely issue: DATABASE_URL is wrong or database is not accessible from Vercel!**

Verify database provider allows connections from Vercel (most cloud DBs do by default).
