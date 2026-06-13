# Production Fix Guide - GenZ Restaurant POS

## CRITICAL ISSUE
Vercel environment variable `DIRECT_URL` mein `pgbouncer=false` parameter missing hai!

## IMMEDIATE FIX (5 minutes)

### Step 1: Update Vercel Environment Variable
1. Go to: https://vercel.com/raghavshahhhs-projects/genz-restaurant-pos/settings/environment-variables
2. Find `DIRECT_URL` variable
3. **Edit** it to:
   ```
   postgresql://postgres.hgnybmsltqpmiaymabvq:tezfa5-Wiqham-civfiv@db.hgnybmsltqpmiaymabvq.supabase.co:5432/postgres?pgbouncer=false
   ```
   (Added `?pgbouncer=false` at the end)
4. Click **Save**
5. **Redeploy** the application (Vercel will auto-redeploy)

### Step 2: Verify Database Has Data
Check Supabase: https://supabase.com/dashboard/project/hgnybmsltqpmiaymabvq/editor

Run this query to verify:
```sql
SELECT 
  (SELECT COUNT(*) FROM "Restaurant") as restaurants,
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Table") as tables,
  (SELECT COUNT(*) FROM "MenuItem") as menu_items;
```

**Expected Result:**
- restaurants: 1
- users: 1  
- tables: 10
- menu_items: 70+

**If counts are 0**, run the SQL from `PRODUCTION_SEED.sql` file again.

### Step 3: Test Production
After redeployment (2-3 min), test:

1. **Login**: https://genz-restaurant-pos.vercel.app/login
   - Email: `admin@genz.com`
   - Password: `admin123`

2. **Check Pages**:
   - Tables: https://genz-restaurant-pos.vercel.app/tables (should show 10 tables)
   - Menu: https://genz-restaurant-pos.vercel.app/menu (should show 70+ items)
   - KOT: https://genz-restaurant-pos.vercel.app/kot (should show "Kitchen is all caught up")

## Why This Fixes Everything

1. **DIRECT_URL with pgbouncer=false**: Disables prepared statements that cause "prepared statement already exists" errors
2. **`dynamic = 'force-dynamic'`**: Prevents Vercel from caching API responses
3. **Multiple status support**: KOT page can now fetch PENDING, PREPARING, and READY orders simultaneously

## What Was Fixed in Code
- `/api/orders/route.ts`: Added multiple status support + force-dynamic
- `/api/menu/route.ts`: Added force-dynamic to prevent caching
- `/api/tables/route.ts`: Added force-dynamic to prevent caching
- `/api/bills/route.ts`: Added force-dynamic to prevent caching
- `/api/reports/route.ts`: Added force-dynamic to prevent caching

## If Issues Persist

### Issue: "Try Again" on KOT page
**Cause**: No orders in database yet
**Solution**: Create a test order:
1. Go to Tables page
2. Click on any Available table
3. Add menu items and save order
4. KOT page will show the order

### Issue: Data disappears after refresh
**Cause**: DIRECT_URL not updated in Vercel
**Solution**: Follow Step 1 above

### Issue: Can't add new tables
**Cause**: Missing restaurantId in session
**Solution**: Clear browser cookies and login again

## Verification Commands

Check if APIs are working:
```bash
# Check tables API
curl https://genz-restaurant-pos.vercel.app/api/tables

# Check menu API  
curl https://genz-restaurant-pos.vercel.app/api/menu

# Check orders API
curl https://genz-restaurant-pos.vercel.app/api/orders
```

All should return JSON data (not errors).
