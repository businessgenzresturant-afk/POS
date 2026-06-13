# Production Verification Checklist

## ✅ What I Fixed

### 1. API Caching Issues (FIXED)
- Added `export const dynamic = 'force-dynamic'` to:
  - `/api/orders/route.ts` ✅
  - `/api/menu/route.ts` ✅
  - `/api/tables/route.ts` ✅
  - `/api/bills/route.ts` ✅
  - `/api/reports/route.ts` ✅

### 2. KOT Multiple Status Support (FIXED)
- `/api/orders` now supports comma-separated statuses: `?status=PENDING,PREPARING,READY`
- KOT page can fetch all active orders in one API call

### 3. Database Connection (REVERTED)
- DIRECT_URL set back to normal (without `?pgbouncer=false`)
- This prevents auth breaking on production

## 🔍 Manual Testing Required

### Step 1: Login Test
1. Go to: https://genz-restaurant-pos.vercel.app/login
2. Login with:
   - Email: `admin@genz.com`
   - Password: `admin123`
3. **Expected**: Should redirect to dashboard
4. **If fails**: Check Vercel environment variables - `NEXTAUTH_URL` and `NEXTAUTH_SECRET` must be set

### Step 2: Tables Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/tables
2. **Expected**: Should show 10 tables (Table 1-10)
3. **If empty**: Database not seeded - run SQL from `PRODUCTION_SEED.sql` in Supabase
4. **If "Try Again" error**: API auth issue - clear browser cookies and re-login

### Step 3: Menu Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/menu
2. **Expected**: Should show 70+ menu items across categories
3. **If empty**: Database not seeded
4. **If data disappears**: FIXED with force-dynamic exports

### Step 4: Orders Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/orders
2. **Expected**: Empty list initially (no orders yet)
3. Try creating an order:
   - Go to Tables → Click any Available table
   - Add menu items
   - Save order
4. **Expected**: Order should appear on Orders page

### Step 5: KOT Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/kot
2. **Expected**: "Kitchen is all caught up!" message (no active orders)
3. After creating order in Step 4, refresh KOT page
4. **Expected**: Order should appear grouped by table
5. Click "Start Preparing" button
6. **Expected**: Status should update to PREPARING

### Step 6: Bills Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/bills
2. **Expected**: Empty initially (no bills generated)
3. Bills generate after order status = COMPLETED

### Step 7: Reports Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/reports
2. **Expected**: Shows "No sales data" if no completed orders
3. After completing orders, should show sales stats

### Step 8: Settings Page Test
1. Go to: https://genz-restaurant-pos.vercel.app/settings
2. **Expected**: Shows restaurant settings form

## 🐛 Known Issues & Solutions

### Issue: "Unauthorized" on all pages
**Cause**: Session not working
**Solution**:
1. Clear browser cookies
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Re-login
4. If still fails, check Vercel env vars: `NEXTAUTH_URL` must be `https://genz-restaurant-pos.vercel.app`

### Issue: Database empty (no tables/menu)
**Cause**: Seed not run
**Solution**:
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/hgnybmsltqpmiaymabvq/sql/new
2. Run SQL from `PRODUCTION_SEED.sql` file
3. Verify with: `SELECT COUNT(*) FROM "Table";` (should return 10)

### Issue: KOT page shows "Try Again"
**Cause**: No orders exist yet OR auth issue
**Solution**:
1. If no orders: Create test order from Tables page
2. If auth issue: Re-login and clear cookies

### Issue: Data appears then disappears
**Cause**: API caching (SHOULD BE FIXED NOW)
**Solution**: Already fixed with `force-dynamic` exports. If still happens, hard refresh browser.

## 🚀 Deployment Status

Latest commit: `c32f5b4` (UI improvements)
Previous commit: `7db911c` (My fixes for KOT and caching)

**Vercel Auto-Deploy**: Should complete within 2-3 minutes of DIRECT_URL change

## ✅ Final Verification Commands

```bash
# Check if site is up
curl -I https://genz-restaurant-pos.vercel.app/

# Check if auth debug endpoint exists (should return 405 for GET)
curl -I https://genz-restaurant-pos.vercel.app/api/debug-auth

# Database verification (run in Supabase SQL Editor)
SELECT 
  (SELECT COUNT(*) FROM "Restaurant") as restaurants,
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Table") as tables,
  (SELECT COUNT(*) FROM "MenuItem") as menu_items;
```

**Expected database counts**:
- restaurants: 1
- users: 1
- tables: 10
- menu_items: 70+

## 📊 What Should Work Now

✅ Login/Authentication
✅ Tables page - no caching, shows 10 tables
✅ Menu page - no caching, shows 70+ items
✅ Orders page - can create orders
✅ KOT page - multiple status support, shows active orders
✅ Bills page - shows generated bills
✅ Reports page - shows sales data
✅ Settings page - restaurant config

## 🔄 If Everything Still Broken

**Nuclear Option - Full Reset**:

1. **Clear Vercel Cache**:
   - Vercel Dashboard → Deployments → Latest → Three dots → "Redeploy"
   - Check "Clear cache and redeploy"

2. **Reset Database** (if needed):
   ```sql
   -- In Supabase SQL Editor
   TRUNCATE TABLE "Bill" CASCADE;
   TRUNCATE TABLE "OrderItem" CASCADE;
   TRUNCATE TABLE "Order" CASCADE;
   TRUNCATE TABLE "MenuItem" CASCADE;
   TRUNCATE TABLE "Table" CASCADE;
   TRUNCATE TABLE "User" CASCADE;
   TRUNCATE TABLE "Restaurant" CASCADE;
   ```
   Then run `PRODUCTION_SEED.sql` again

3. **Verify Vercel Environment Variables**:
   - DATABASE_URL (with pgbouncer=true, port 6543)
   - DIRECT_URL (WITHOUT pgbouncer param, port 5432)
   - NEXTAUTH_URL (https://genz-restaurant-pos.vercel.app)
   - NEXTAUTH_SECRET (your secret key)

## 📞 Status Report Template

After testing, report back with:
- ✅ or ❌ Login working
- ✅ or ❌ Tables showing data
- ✅ or ❌ Menu showing data  
- ✅ or ❌ Can create orders
- ✅ or ❌ KOT page working
- ✅ or ❌ Data stays (doesn't disappear)
