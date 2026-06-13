# ✅ CORRECT VERCEL ENVIRONMENT VARIABLES

## 🚨 UPDATE AGAIN - Use Correct Hosts!

Go to: https://vercel.com/raghavshahhhs-projects/genz-restaurant-pos/settings/environment-variables

## DATABASE_URL (Pooler - Port 6543)
**Use POOLER host** for connection pooling:
```
postgresql://postgres:zYtvi7-rebdex-gokbix@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**OR** (if above doesn't work, try this region):
```
postgresql://postgres:zYtvi7-rebdex-gokbix@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## DIRECT_URL (Direct - Port 5432)  
**Use DIRECT host** for migrations:
```
postgresql://postgres:zYtvi7-rebdex-gokbix@db.hgnybmsltqpmiaymabvq.supabase.co:5432/postgres
```

## 🔍 How to Find Correct Pooler URL:

1. Go to Supabase: https://supabase.com/dashboard/project/hgnybmsltqpmiaymabvq/settings/database
2. Scroll to "Connection String" section
3. **Select "URI" tab**
4. **Check "Use connection pooling" checkbox**
5. **Select "Session mode"**
6. Copy that URL (it will have port 6543 and pooler.supabase.com)
7. Replace password with: `zYtvi7-rebdex-gokbix`

## Key Differences:
- **DATABASE_URL**: pooler host + port 6543 (for app connections)
- **DIRECT_URL**: db host + port 5432 (for migrations/seeds)

## After Update:
- Make sure to select **Production, Preview, AND Development** when saving
- Wait 2-3 min for redeploy
- Hard refresh browser (Ctrl+Shift+R)
