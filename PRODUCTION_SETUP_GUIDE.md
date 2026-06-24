# 🚀 Production Setup Guide

## ✅ CURRENT STATUS (June 24, 2026)

### Working Credentials
```
URL: https://pos.gen-z.online/login
Email: admin@genz.com
Password: admin123
Status: ✅ WORKING (You confirmed this works!)
```

---

## 🎯 IMMEDIATE NEXT STEPS

### Step 1: Seed Tables & Menu Data

Since you're already logged in with `admin@genz.com`, follow these steps:

1. **Visit Seed Page**
   ```
   https://pos.gen-z.online/admin/seed
   ```

2. **Click "🚀 Seed Tables" button**
   - This will create 10 tables (Table 1-10)
   - If tables already exist, it will show you existing tables

3. **Click "🚀 Seed Menu Items" button**
   - This will create ~22 sample menu items
   - If menu already exists, it will skip

4. **Go to Dashboard**
   ```
   https://pos.gen-z.online/dashboard
   ```
   - Tables should now be visible
   - You can start taking orders

---

## 📝 ABOUT THE EXISTING ADMIN ACCOUNT

The production database already has an admin account created by the seed script:

**Existing Admin:**
- Email: `admin@genz.com`
- Password: `admin123`
- Role: ADMIN
- Created: During initial deployment

**Why Registration Failed:**
- You tried to register `business.genzresturant@gmail.com`
- But first user (`admin@genz.com`) is already ADMIN
- Second user would become STAFF (not ADMIN)
- OR the database connection had issues

---

## 🔐 CHANGE ADMIN EMAIL (Optional)

If you want to use `business.genzresturant@gmail.com` instead of `admin@genz.com`:

### Option A: Via Database (Recommended)

Run this in Vercel Postgres dashboard:

```sql
UPDATE "User" 
SET email = 'business.genzresturant@gmail.com', 
    name = 'Business Admin',
    password = '$2a$10$YourHashedPasswordHere'
WHERE email = 'admin@genz.com';
```

### Option B: Create a Settings Page

We can add a "Change Email" feature in Settings page later.

### Option C: Use Current Account

Just continue using `admin@genz.com` for now - it has full admin access!

---

## 🔍 TROUBLESHOOTING REGISTRATION ERROR

The "Internal server error" during registration could be:

### Issue 1: User Already Exists
```
Error: User with email "admin@genz.com" already exists
Solution: Use existing credentials above
```

### Issue 2: Database Connection
```
Error: Can't reach database server
Solution: Check Vercel environment variables:
- DATABASE_URL (must be set)
- DIRECT_URL (for Prisma migrations)
```

### Issue 3: Missing Environment Variables
Required in Vercel:
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="vW8xK3mN9pQ2rT5yU7zA4bC6dE8fG0hJ2kL4mN6pQ8s"
NEXTAUTH_URL="https://pos.gen-z.online"
```

---

## 📊 VERIFY VERCEL ENVIRONMENT VARIABLES

Go to Vercel Dashboard:
1. Open project: `genz-restaurant-pos`
2. Go to **Settings** → **Environment Variables**
3. Check these exist for **Production**:

### Required Variables:

#### DATABASE_URL
```
postgresql://username:password@host:port/database?sslmode=require
```
**Important:** Must include `?sslmode=require` for Vercel/Neon/Supabase

#### NEXTAUTH_SECRET
```
vW8xK3mN9pQ2rT5yU7zA4bC6dE8fG0hJ2kL4mN6pQ8s
```
**Important:** Must be the same across all deployments for session persistence

#### NEXTAUTH_URL
```
https://pos.gen-z.online
```
**Important:** Must match your production domain exactly

#### DIRECT_URL (Optional but recommended)
```
postgresql://username:password@host:port/database?sslmode=require
```
Used for Prisma migrations

---

## 🎯 WHAT TO DO NOW

### Immediate Action (5 minutes):

1. ✅ **You're already logged in** with `admin@genz.com` / `admin123`

2. 🚀 **Visit seed page:**
   ```
   https://pos.gen-z.online/admin/seed
   ```

3. 📊 **Seed tables and menu:**
   - Click "Seed Tables" button
   - Click "Seed Menu Items" button
   - Wait for success messages

4. 🎉 **Go to dashboard:**
   ```
   https://pos.gen-z.online/dashboard
   ```
   - Tables should be visible now
   - Menu items should be available
   - You can start taking orders!

### If Still No Data:

1. **Check Vercel Logs:**
   - Go to Vercel dashboard
   - Open Deployments → Latest deployment
   - Click "View Function Logs"
   - Look for errors in `/api/admin/seed-tables` and `/api/admin/seed-menu`

2. **Check Database Connection:**
   - The error suggests database might not be accessible
   - Verify DATABASE_URL is correct
   - Test connection from Vercel deployment

3. **Manual Database Seed:**
   - We can run seed SQL directly if needed
   - Share database details (DM me, don't post publicly)

---

## 📺 KDS TV DISPLAY URL

After seeding data, get KDS token from:
```
https://pos.gen-z.online/settings
```

Scroll down to "Kitchen Display Link" section to get the TV display URL.

---

## 🆘 STILL STUCK?

Tell me:
1. ✅ Can you access `/admin/seed` page after login?
2. ❓ What happens when you click "Seed Tables"?
3. ❓ Any error messages shown?
4. ❓ Can you check Vercel Function Logs for errors?

---

**Most Important: Just login with `admin@genz.com` / `admin123` and visit `/admin/seed` to initialize data!** 🎯
