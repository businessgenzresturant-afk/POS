# Security & Architecture Weakness Analysis
**Date:** June 25, 2026  
**Scope:** Production security vulnerabilities, performance issues, edge cases  
**Status:** 🟡 Medium Risk - Action Required

---

## 🔴 CRITICAL WEAKNESSES (P0 - Fix Immediately)

### 1. Missing Rate Limiting on Critical Endpoints
**Severity:** HIGH  
**Impact:** DoS attacks, resource exhaustion

**Problem:**
Not all PATCH/DELETE endpoints have rate limiting applied.

**Missing Rate Limits:**
- ❌ `PATCH /api/bills/[id]` - No rate limit (payment manipulation risk)
- ❌ `PATCH /api/orders/[id]` - No rate limit (order status manipulation)
- ❌ `DELETE /api/orders/[id]` - No rate limit (data deletion abuse)
- ❌ `PATCH /api/orders/[id]/items/[itemId]` - No rate limit (item cancellation spam)
- ❌ `DELETE /api/tables/[id]` - No rate limit (table deletion abuse)
- ❌ `PATCH /api/menu/[id]` - No rate limit (menu manipulation)
- ❌ `DELETE /api/menu/[id]` - No rate limit (menu deletion)

**Attack Scenario:**
```bash
# Attacker can spam bill updates or order cancellations
for i in {1..1000}; do
  curl -X PATCH https://pos.gen-z.online/api/bills/BILL_ID \
    -d '{"status":"PAID"}' &
done
# Result: Database overload, potential race conditions
```

**Fix Required:**
```typescript
// Add to EVERY endpoint:
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

export async function PATCH(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }
  // ... rest of code
}
```

**Files to Update:**
1. `src/app/api/bills/[id]/route.ts`
2. `src/app/api/orders/[id]/route.ts`
3. `src/app/api/orders/[id]/items/[itemId]/route.ts`
4. `src/app/api/tables/[id]/route.ts`
5. `src/app/api/menu/[id]/route.ts`

---

### 2. Missing Input Sanitization in Bill Updates
**Severity:** HIGH  
**Impact:** SQL injection, XSS

**Problem:**
`PATCH /api/bills/[id]` accepts `customerName` and `customerPhone` but does NOT sanitize them before database insert.

**Vulnerable Code:**
```typescript
// File: src/app/api/bills/[id]/route.ts line 62
const { customerPhone, customerName } = body; // ❌ NO SANITIZATION

// Later used directly:
customer = await tx.customer.create({
  data: {
    phone: customerPhone,        // ❌ Unsanitized
    name: customerName || null   // ❌ Unsanitized
  }
});
```

**Attack Example:**
```bash
curl -X PATCH /api/bills/BILL_ID \
  -d '{"customerName":"<script>alert(1)</script>","customerPhone":"--DROP TABLE"}'
```

**Fix Required:**
```typescript
import { sanitizeCustomerInput } from '@/lib/sanitize';

const sanitizedName = customerName ? sanitizeCustomerInput(customerName) : null;
const sanitizedPhone = customerPhone ? sanitizeCustomerInput(customerPhone) : null;

customer = await tx.customer.create({
  data: {
    phone: sanitizedPhone,
    name: sanitizedName
  }
});
```

---

### 3. In-Memory Rate Limiter - Not Production Ready
**Severity:** MEDIUM-HIGH  
**Impact:** Rate limits don't work across multiple Vercel serverless instances

**Problem:**
Current rate limiter uses in-memory Map which resets on each serverless cold start and doesn't sync across instances.

**Current Implementation:**
```typescript
// File: src/lib/rateLimit.ts
class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map(); // ❌ Lost on restart
}
```

**Why This Fails in Production:**
- Vercel runs multiple serverless instances
- Each instance has its own memory
- User makes 100 requests → distributed across 10 instances = 10 requests per instance
- Rate limit of 100/min becomes 1000/min effectively

**Evidence:**
```typescript
// File header already warns about this:
/**
 * PRODUCTION NOTE: For production deployments with multiple servers,
 * replace this with a distributed rate limiter using Redis
 */
```

**Fix Required:**
Use Redis-based rate limiting (Upstash for Vercel):

```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, remaining, resetAt: reset };
}
```

**Cost:** Upstash free tier: 10,000 requests/day (sufficient for start)

---

### 4. CSRF Bypass via Missing Origin/Referer
**Severity:** MEDIUM  
**Impact:** CSRF attacks when both headers absent

**Problem:**
Middleware allows requests when BOTH Origin and Referer are missing.

**Vulnerable Code:**
```typescript
// File: src/middleware.ts line 27-39
if (origin && !allowedOrigins.some(...)) {
  return 403; // Blocks if origin present and invalid
}

if (!origin && referer && !allowedOrigins.some(...)) {
  return 403; // Blocks if referer present and invalid
}

// ❌ BUT: If BOTH origin AND referer are missing → request passes!
```

**Attack Scenario:**
Old browsers or crafted requests without Origin/Referer headers bypass CSRF protection.

**Fix Required:**
```typescript
// Require at least one header to be present and valid
if (!origin && !referer) {
  console.warn(`🚨 CSRF blocked: No origin or referer header`);
  return NextResponse.json(
    { error: 'CSRF validation failed - missing security headers' },
    { status: 403 }
  );
}
```

---

## 🟡 MEDIUM WEAKNESSES (P1 - Fix Soon)

### 5. No Database Connection Pooling Limits
**Severity:** MEDIUM  
**Impact:** "Too many clients" errors under load

**Problem:**
Prisma connection string doesn't specify `connection_limit` parameter.

**Risk:**
- Supabase pooler has 200 connection limit
- Each API call creates new connection
- Spike traffic (50+ concurrent requests) → exceeds pool
- Result: "sorry, too many clients already" errors

**Current Config:**
```bash
# .env - Missing connection_limit
DATABASE_URL="postgresql://...@...:6543/postgres?pgbouncer=true"
```

**Fix Required:**
```bash
DATABASE_URL="postgresql://...@...:6543/postgres?pgbouncer=true&connection_limit=10"
```

Also add Prisma config:
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 10
  connection_limit = 10
}
```

---

### 6. No Request Timeout Protection
**Severity:** MEDIUM  
**Impact:** Slow queries block serverless functions, cost money

**Problem:**
No timeout on API routes - slow database queries can run forever (until Vercel 60s limit).

**Risk:**
- Complex report queries without indexes
- Attacker sends malicious query → 60s execution
- Result: High Vercel costs, blocked functions

**Fix Required:**
Add timeout middleware:
```typescript
// src/lib/timeout.ts
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

// Usage in API routes:
const result = await withTimeout(
  prisma.order.findMany(...),
  5000 // 5 second timeout
);
```

---

### 7. Cancel Reason Not Validated Length
**Severity:** LOW-MEDIUM  
**Impact:** Database bloat, potential DoS

**Problem:**
Cancel reason accepts unlimited length input (can store megabytes of text).

**Vulnerable Code:**
```typescript
// src/app/api/orders/[id]/items/[itemId]/route.ts line 26
if (!cancelReason || cancelReason.trim().length === 0) {
  return error; // ❌ Only checks if empty, not if too long
}
```

**Attack:**
```bash
curl -X PATCH /api/orders/ID/items/ITEM_ID \
  -d '{"status":"CANCELLED","cancelReason":"A".repeat(1000000)}'
# 1MB cancel reason → database bloat
```

**Fix Required:**
```typescript
if (!cancelReason || cancelReason.trim().length === 0) {
  return error;
}

if (cancelReason.length > 500) { // ✅ Add length limit
  return NextResponse.json(
    { error: 'Cancellation reason too long (max 500 characters)' },
    { status: 400 }
  );
}
```

---

### 8. No Audit Log for Sensitive Actions
**Severity:** MEDIUM  
**Impact:** No accountability trail for disputes

**Problem:**
Critical actions (bill paid, item cancelled, order deleted) tracked in database but no centralized audit log.

**Missing Audit Trails:**
- Who marked bill as PAID? (user ID stored but no query interface)
- When was item cancelled? (timestamp exists but no log UI)
- Who deleted order? (no tracking at all)

**Current State:**
```typescript
// Item cancellation tracks user:
cancelledByUserId: userId  // ✅ Stored

// But no way to query:
// "Show me all cancellations by staff X today"
// "Show me all bills marked paid by user Y this week"
```

**Fix Required:**
Create audit log table:
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // "BILL_PAID", "ITEM_CANCELLED", "ORDER_DELETED"
  entityType  String   // "Bill", "OrderItem", "Order"
  entityId    String
  metadata    Json?    // Additional context
  ipAddress   String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 🟢 LOW WEAKNESSES (P2 - Monitor)

### 9. KDS Token Regeneration Has No Cooldown
**Severity:** LOW  
**Impact:** Staff can spam token regeneration

**Problem:**
`POST /api/settings/kds-token/regenerate` has no cooldown - can be called 100 times per minute.

**Risk:**
- Malicious staff invalidates KDS display repeatedly
- TV display keeps disconnecting
- Operational disruption

**Fix:**
Add stricter rate limit:
```typescript
const rateLimit = checkRateLimit(request, {
  maxRequests: 3,           // Only 3 regenerations
  windowMs: 60 * 60 * 1000  // per hour
});
```

---

### 10. No Backup/Restore for Critical Data
**Severity:** LOW  
**Impact:** Data loss in disaster scenario

**Current State:**
- Supabase provides automatic backups (7 days)
- But no documented restore procedure
- No export/import functionality for:
  - Menu items (staff can't export/backup)
  - Customer database
  - Historical reports

**Recommendation:**
Add export endpoints:
```typescript
// GET /api/admin/export/menu → JSON download
// GET /api/admin/export/customers → CSV download
// GET /api/admin/export/orders?date=2026-06 → JSON download
```

---

### 11. Debug Endpoints in Production
**Severity:** LOW  
**Impact:** Information disclosure

**Problem:**
Debug endpoints check `NODE_ENV === 'production'` to disable, but this can be misconfigured.

**Vulnerable Endpoints:**
- `/api/debug`
- `/api/debug-auth`
- `/api/debug/session`
- `/api/reset-passwords`
- `/api/setup`
- `/api/seed`

**Risk:**
If `NODE_ENV` accidentally not set → debug endpoints accessible in production.

**Better Fix:**
Remove debug endpoints entirely from production build:
```typescript
// next.config.js
module.exports = {
  webpack: (config, { dev }) => {
    if (!dev) {
      // Remove debug files from production build
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /\/api\/(debug|seed|setup)/,
        })
      );
    }
    return config;
  }
}
```

Or use feature flags:
```typescript
if (!process.env.ENABLE_DEBUG_ENDPOINTS) {
  return new NextResponse('Not Found', { status: 404 });
}
```

---

## 📊 PERFORMANCE WEAKNESSES

### 12. N+1 Query in Orders Endpoint
**Severity:** MEDIUM  
**Impact:** Slow page loads as order count grows

**Problem:**
Orders endpoint loads all items + menuItems for each order (inefficient).

**Code:**
```typescript
// src/app/api/orders/route.ts
const orders = await prisma.order.findMany({
  include: {
    items: {
      include: {
        menuItem: true  // ❌ N+1: Loads menuItem for EACH item
      }
    }
  }
});
```

**Impact:**
- 10 orders × 5 items each = 50 menuItem queries
- 100 orders × 5 items = 500 queries → SLOW

**Fix:**
Use Prisma's built-in join optimization or limit query size:
```typescript
// Option 1: Limit results
const orders = await prisma.order.findMany({
  take: 50,  // Only last 50 orders
  orderBy: { createdAt: 'desc' }
});

// Option 2: Add pagination
const page = parseInt(searchParams.get('page') || '1');
const limit = 20;
const skip = (page - 1) * limit;

const orders = await prisma.order.findMany({
  skip,
  take: limit,
  include: { /* ... */ }
});
```

---

### 13. No Caching on Menu Items
**Severity:** LOW-MEDIUM  
**Impact:** Unnecessary database queries

**Problem:**
Menu items rarely change but fetched from database on every request.

**Current:**
```typescript
// Every dashboard/order load hits database
const menuItems = await prisma.menuItem.findMany(...);
```

**Fix:**
Add Next.js cache revalidation:
```typescript
// src/app/api/menu/route.ts
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  const menuItems = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    orderBy: { name: 'asc' }
  });
  
  return NextResponse.json(menuItems, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

---

## 🔄 EDGE CASES & RACE CONDITIONS

### 14. Concurrent Bill Generation Race Condition
**Severity:** MEDIUM  
**Impact:** Duplicate bills for same order

**Problem:**
Two staff members click "Generate Bill" simultaneously → two bills created.

**Vulnerable Code:**
```typescript
// src/app/api/bills/route.ts
// Check if bill exists
const existingBill = await prisma.bill.findFirst({
  where: { orderId }
});

if (existingBill) {
  return error; // ❌ But what if both requests check simultaneously?
}

// Create bill
const bill = await prisma.bill.create({ ... });
```

**Race Condition Timeline:**
```
Time  | Staff A             | Staff B
------|---------------------|--------------------
T0    | Check: No bill      | Check: No bill
T1    | Create bill A       | Create bill B
T2    | ✅ Bill A created   | ✅ Bill B created (DUPLICATE!)
```

**Fix:**
Use database unique constraint:
```prisma
model Bill {
  orderId String @unique // ✅ Database-level uniqueness
  // ...
}
```

Then handle error:
```typescript
try {
  const bill = await prisma.bill.create({ data: { orderId, ... } });
} catch (error) {
  if (error.code === 'P2002') { // Unique constraint violation
    return NextResponse.json(
      { error: 'Bill already exists for this order' },
      { status: 409 }
    );
  }
  throw error;
}
```

---

### 15. Table Status Race on Concurrent Orders
**Severity:** LOW  
**Impact:** Table marked occupied twice

**Problem:**
Already fixed with transaction in orders API, but worth documenting.

**Current Protection:**
```typescript
// src/app/api/orders/route.ts line 195
await prisma.$transaction(async (tx) => {
  const currentTable = await tx.table.findUnique(...); // ✅ Locked in transaction
  // Create order
  // Update table status
});
```

✅ **Status:** Already mitigated with database transaction

---

## 🎯 RECOMMENDATIONS SUMMARY

### Immediate Actions (This Week):
1. ✅ Add rate limiting to all PATCH/DELETE endpoints
2. ✅ Sanitize customer inputs in bill update API
3. ✅ Add CSRF protection for missing headers case
4. ✅ Add cancel reason length validation

### Short-term (This Month):
1. 🔄 Migrate to Redis-based rate limiting (Upstash)
2. 🔄 Add database connection limits to Prisma
3. 🔄 Implement request timeouts
4. 🔄 Add audit log system
5. 🔄 Add unique constraint on Bill.orderId

### Long-term (Next Quarter):
1. 📋 Build admin audit log UI
2. 📋 Add export/backup functionality
3. 📋 Implement menu caching
4. 📋 Add order pagination
5. 📋 Remove debug endpoints from production build

---

## 📈 RISK SCORE

**Overall Security:** 6.5/10 (Medium Risk)
- ✅ Authentication: Strong (NextAuth + rate limiting)
- ✅ Authorization: Good (role-based checks)
- ✅ SQL Injection: Protected (Prisma + sanitization)
- ✅ CSRF: Protected (middleware)
- ⚠️ Rate Limiting: Weak (in-memory, incomplete)
- ⚠️ Input Validation: Gaps (bill updates, cancel reason)
- ⚠️ Audit Trail: Missing

**Performance:** 7/10 (Acceptable)
- ✅ Database: Transaction pooler used
- ✅ API: Serverless scales automatically
- ⚠️ Queries: N+1 issues exist
- ⚠️ Caching: Minimal implementation

**Resilience:** 5/10 (Needs Improvement)
- ✅ Backup: Automatic (Supabase)
- ⚠️ Race Conditions: Some exist
- ⚠️ Timeouts: Not implemented
- ❌ Connection Limits: Not configured

---

**Generated:** June 25, 2026  
**Next Review:** After P0/P1 fixes implemented

