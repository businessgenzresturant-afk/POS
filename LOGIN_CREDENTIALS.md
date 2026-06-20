# 🔐 LOGIN CREDENTIALS - GenZ Restaurant POS

## Dev Server Status
✅ **Server Running:** http://localhost:3000

## Available User Accounts

### Option 1: Simple Credentials (Recommended)
```
Email: admin@genz.com
Password: admin123
Role: ADMIN (Full Access)
```

```
Email: staff@genz.com
Password: staff123
Role: STAFF (Limited Access)
```

### Option 2: Alternative Credentials
```
Email: admin@genzrestaurant.com
Password: admin123
Role: ADMIN
```

```
Email: manager@genzrestaurant.com
Password: manager123
Role: STAFF
```

```
Email: cashier@genzrestaurant.com
Password: cashier123
Role: STAFF
```

## Database Status
✅ **Users:** 5 accounts found in database  
✅ **Restaurant:** GenZ Restaurant configured  
✅ **Menu Items:** 265 items loaded  
✅ **Tables:** 10 tables configured  

## If Login Still Fails

### Step 1: Clear Browser Cache
1. Open browser Dev Tools (F12)
2. Go to Application tab
3. Clear all cookies for localhost:3000
4. Close and reopen browser

### Step 2: Check Console
1. Open browser Dev Tools (F12)
2. Go to Console tab
3. Look for any red errors
4. Share the error message if you see any

### Step 3: Verify Server
Open http://localhost:3000 in browser - you should see the login page.

### Step 4: Test API Directly
Try this in a new terminal:
```bash
curl http://localhost:3000/api/auth/session
```

Should return session info or empty object.

## Common Issues

### Issue: "Invalid credentials" error
**Solution:** Make sure you're using the EXACT credentials listed above (case-sensitive)

### Issue: Page won't load
**Solution:** 
1. Stop the dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Wait for "Ready in X ms" message
4. Try again

### Issue: Database connection error
**Solution:**
1. Make sure PostgreSQL is running
2. Check .env file has correct DATABASE_URL
3. Run: `npx prisma db push`

## Reset Everything (Last Resort)

If nothing works, run these commands:
```bash
# Stop dev server first (Ctrl+C)
npx prisma db push --force-reset
npx prisma db seed
npm run dev
```

Then use: `admin@genz.com` / `admin123`

---

**Last Updated:** June 20, 2026  
**Dev Server Port:** 3000  
**Database:** PostgreSQL (restaurant_pos)
