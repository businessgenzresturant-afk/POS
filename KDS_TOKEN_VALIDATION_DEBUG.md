# KDS Token Validation Debugging Guide

## Issue
KDS Display page stuck on "Validating access..." with spinning loader - never loads the actual KDS.

## Root Cause Investigation

### What I Found
1. ✅ Validation endpoint EXISTS at `/api/kds-display/[token]/validate/route.ts`
2. ✅ Database schema has `kdsDisplayToken` field on Restaurant model (unique, optional)
3. ✅ Token generation endpoints exist and working
4. ✅ Build is successful, no TypeScript errors

### Likely Issues

**Issue #1: Token Not in Production Database**
- User regenerated token in local/staging but production database doesn't have it
- OR token was generated but database write failed silently

**Issue #2: Production Build Not Updated**
- Vercel deployment might be stuck on old code
- Need to verify deployment actually completed

**Issue #3: Network/CORS Issue**
- TV browser might be blocking API calls
- Or fetch is failing silently

## Debugging Steps Added

### Server-Side Logging (Production)
Added to `/api/kds-display/[token]/validate/route.ts`:
- Logs received token (first 10 chars for security)
- Logs if restaurant found or not
- Logs total restaurants and how many have tokens (for debugging)
- Clear success/failure messages

### Client-Side Logging (TV Browser)
Added to KDS display page:
- Logs token being validated
- Logs API URL being called
- Logs response status
- Logs success/failure with details

## Next Steps for User

### Step 1: Check Browser Console on TV
1. On the TV, open browser developer tools (usually F12)
2. Go to Console tab
3. Refresh the KDS display page
4. Look for messages starting with:
   - 🔍 Client: Validating KDS token
   - 📡 Client: Calling API
   - 📥 Client: Response status
   - ✅ or ❌ messages

**Share these logs** - they will show exactly where it's failing.

### Step 2: Verify Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Check if latest deployment is "Ready" (not Building/Failed)
3. Check deployment logs for any errors
4. Deployment should show commit: "Add detailed logging to KDS token validation"

### Step 3: Verify Token in Database
Check if the token actually exists:
```sql
SELECT id, name, kdsDisplayToken 
FROM "Restaurant" 
WHERE kdsDisplayToken IS NOT NULL;
```

### Step 4: Manual Test API Endpoint
Try accessing the validation endpoint directly in browser:
```
https://pos.gen-z.online/api/kds-display/[YOUR_TOKEN_HERE]/validate
```

**Expected response if working:**
```json
{
  "restaurantId": "xxx-xxx-xxx",
  "restaurantName": "Your Restaurant Name"
}
```

**If token invalid:**
```json
{
  "error": "Invalid token"
}
```

## Quick Fix Options

### Option A: Regenerate Token (Recommended)
1. Login to https://pos.gen-z.online as ADMIN
2. Go to Settings → KDS Display
3. Click "Regenerate Token"
4. Copy the NEW URL
5. Open on TV

### Option B: Direct Database Token Verification
If regenerate doesn't work, we need to check:
1. Is Supabase connection working?
2. Does the Restaurant record exist?
3. Is the token field populated?

## Files Modified
- `src/app/api/kds-display/[token]/validate/route.ts` - Added detailed server logging
- `src/app/kds-display/[token]/page.tsx` - Added detailed client logging

## Deployment
- ✅ Build passed
- ✅ TypeScript validated
- ✅ Pushed to master (commit 83f8140)
- ⏳ Waiting for Vercel auto-deploy

---

## What to Tell Me

After the Vercel deployment completes and you try again:

1. **What do the browser console logs show?** (F12 → Console on TV)
2. **What happens when you test the API URL directly in browser?**
3. **Did token regeneration work or fail?**

This will tell us exactly where the issue is:
- Token not in database → regenerate issue
- API returning 404 → database lookup problem
- API not responding → deployment/network issue
- Client getting response but failing → frontend logic issue
