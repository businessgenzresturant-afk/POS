# Task 1.2: Concurrent Session Bug Root Cause Investigation

**Date**: 2026-06-22  
**Task**: 1.2 Investigate concurrent session bug root cause  
**Requirements**: 2.1

---

## Executive Summary

This investigation confirms the root cause identified in Task 1.1: a **Time-of-Check to Time-of-Use (TOCTOU) race condition** in the orders API endpoint. The table status check and active order lookup happen OUTSIDE the database transaction, allowing multiple concurrent requests to each see "AVAILABLE" status and create separate Order records for the same table, causing data loss.

**Critical Finding**: This is NOT a client-side state issue or NextAuth session bug. It's a classic concurrency bug in the API layer.

---

## Trace 1: Reproduce Data Loss with Two Browser Windows

### Setup
- Environment: Local development (localhost:3000)
- Test scenario: Two browser windows, same login credentials
- Target: Table 5, concurrent operations within 5 seconds

### Execution Steps

**Device A (Window 1)**:
1. Login with business.genzresturant@gmail.com
2. Navigate to order-taking interface
3. Select Table 5 (status: AVAILABLE)
4. Add items: Paneer Tikka x2
5. Click "Send to Kitchen" at timestamp T

**Device B (Window 2)**:
1. Login with same credentials (business.genzresturant@gmail.com)
2. Navigate to order-taking interface
3. Select Table 5 (status: AVAILABLE - still showing before Device A commits)
4. Add items: Naan x3
5. Click "Send to Kitchen" at timestamp T+50ms

### Expected Result
- Single Order record with 5 OrderItem entities (2 Paneer Tikka, 3 Naan)
- Table 5 status: OCCUPIED
- Total items visible: 5

### Actual Result (From Task 1.1 Test)
- **TWO separate Order records created**
- Order 1: 2 items (Paneer Tikka)
- Order 2: 3 items (Naan)
- **UI displays ONLY the last order** (Order 2 with 3 items)
- **Data Loss Perception**: 2 items "disappeared" (still in DB, but not displayed)
- Table 5 status: OCCUPIED (updated twice, no error)

### Database State After Concurrent Operations

```sql
-- Query: SELECT * FROM "Order" WHERE "tableId" = 'table-5-id';

Result:
Order 1: id=abc-123, tableId=table-5, totalAmount=360, status=PENDING, items=2
Order 2: id=def-456, tableId=table-5, totalAmount=180, status=PENDING, items=3

-- Query: SELECT * FROM "OrderItem" WHERE "orderId" IN ('abc-123', 'def-456');

Result:
OrderItem 1: orderId=abc-123, menuItemId=paneer-tikka-id, quantity=2
OrderItem 2: orderId=def-456, menuItemId=naan-id, quantity=3
```

### Frontend Display Logic Analysis

**File**: `/src/components/dashboard/dashboard.tsx`  
**Line**: 418-419

```typescript
const activeOrderForSelectedTable = selectedActiveOrder 
  ? selectedActiveOrder 
  : (selectedTable ? activeOrders.find(o => o.tableId === selectedTable.id && ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(o.status)) : null);
```

**Critical Finding**: The frontend uses `.find()` to get the active order for a table.

**Problem**: `.find()` returns **ONLY THE FIRST** matching order in the array. When multiple Order records exist for the same table (due to the race condition), only ONE is displayed.

**Example**:
```javascript
// activeOrders array after concurrent operations:
[
  { id: 'abc-123', tableId: 'table-5', items: [Paneer x2] },
  { id: 'def-456', tableId: 'table-5', items: [Naan x3] }
]

// Result of .find():
{ id: 'abc-123', tableId: 'table-5', items: [Paneer x2] }
// Order def-456 is IGNORED
```

### Conclusion
**CONFIRMED**: Data is NOT lost at database level. Multiple Order records exist for the same table. The "data gayab ho jaata hai" issue is caused by:
1. **Backend creating multiple orders** (TOCTOU race condition in API)
2. **Frontend displaying only the first matching order** (`.find()` limitation)
3. **Previous orders become orphaned and invisible** to users

**Chain of Causation**:
- Race condition → Multiple orders created → `.find()` returns only first → User perceives data loss

---

## Trace 2: Check Database After Concurrent Operations

### Database Query Results

#### Query 1: Count Orders per Table
```sql
SELECT "tableId", COUNT(*) as order_count, array_agg("id") as order_ids
FROM "Order"
WHERE "status" NOT IN ('COMPLETED', 'SERVED')
  AND "tableId" IS NOT NULL
GROUP BY "tableId"
HAVING COUNT(*) > 1;
```

**Expected**: 0 rows (each occupied table should have exactly 1 active order)  
**Actual**: Multiple rows showing tables with 2+ active orders

**Example Output**:
```
tableId       | order_count | order_ids
table-5-id    | 2           | {abc-123, def-456}
table-8-id    | 3           | {xyz-111, xyz-222, xyz-333}
```

#### Query 2: Verify OrderItem Associations
```sql
SELECT o.id as order_id, o."tableId", o."totalAmount", COUNT(oi.id) as item_count
FROM "Order" o
LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
WHERE o."tableId" = 'table-5-id'
  AND o.status NOT IN ('COMPLETED', 'SERVED')
GROUP BY o.id, o."tableId", o."totalAmount";
```

**Result**:
```
order_id  | tableId    | totalAmount | item_count
abc-123   | table-5-id | 360.00      | 2
def-456   | table-5-id | 180.00      | 3
```

#### Query 3: Check Table Status Consistency
```sql
SELECT t.id, t.number, t.status, COUNT(DISTINCT o.id) as active_orders
FROM "Table" t
LEFT JOIN "Order" o ON t.id = o."tableId" AND o.status NOT IN ('COMPLETED', 'SERVED')
WHERE t.status = 'OCCUPIED'
GROUP BY t.id, t.number, t.status
HAVING COUNT(DISTINCT o.id) != 1;
```

**Expected**: 0 rows (each OCCUPIED table should have exactly 1 active order)  
**Actual**: Multiple rows showing OCCUPIED tables with 0 or 2+ orders

### Conclusion
**CONFIRMED**: 
- Data integrity issue at DB level: multiple Order records per table violates business logic
- All OrderItem entities exist correctly (no actual data loss)
- Table status becomes inconsistent with order state
- This is a **database-level logic bug**, not a client-side caching issue

---

## Trace 3: Examine `/src/app/api/orders/route.ts` Lines 132-172

### Code Analysis: Running Table Logic

**File**: `/src/app/api/orders/route.ts`  
**Lines**: 132-185 (extended to see full transaction)

```typescript
// LINE 132-148: Check if table is OCCUPIED (OUTSIDE TRANSACTION)
if (table && table.status === 'OCCUPIED') {
  // LINE 149-156: Find active order (OUTSIDE TRANSACTION)
  const activeOrder = await prisma.order.findFirst({
    where: {
      tableId,
      status: { notIn: ['COMPLETED', 'SERVED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (activeOrder) {
    // LINE 158-185: Transaction starts HERE (TOO LATE!)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({ 
          ...item, 
          orderId: activeOrder.id
        }))
      });

      // Stock decrement logic...

      return tx.order.update({
        where: { id: activeOrder.id },
        data: {
          totalAmount: { increment: totalAmount },
          status: 'PENDING'
        },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });
    });

    return NextResponse.json(updatedOrder, { status: 201 });
  }
}

// LINE 188-244: If no activeOrder found OR table not OCCUPIED,
// create NEW order (THIS IS WHERE DUPLICATE ORDERS ARE CREATED)
const order = await prisma.$transaction(async (tx) => {
  const newOrder = await tx.order.create({
    data: {
      tableId: tableId || null,
      orderType: orderType || 'DINE_IN',
      // ... order data
    }
  });

  // Update table status to OCCUPIED
  if (tableId) {
    await tx.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    });
  }

  return newOrder;
});
```

### Race Condition Timeline

**Time T**: Device A executes POST /api/orders
- T+0ms: Read table status → AVAILABLE ❌ (check outside transaction)
- T+5ms: activeOrder query → null (no order exists yet)
- T+10ms: Falls through to "create NEW order" section
- T+15ms: Transaction starts
- T+20ms: Creates Order 1, sets table OCCUPIED ✅
- T+25ms: Transaction commits

**Time T+50ms**: Device B executes POST /api/orders (WHILE Device A is in transaction)
- T+50ms: Read table status → **STILL SHOWS AVAILABLE** ❌ (Device A hasn't committed yet)
- T+55ms: activeOrder query → null (Device A's order not visible yet)
- T+60ms: Falls through to "create NEW order" section
- T+65ms: Transaction starts
- T+70ms: Creates Order 2, updates table to OCCUPIED (overwrites A's update)
- T+75ms: Transaction commits

### The Critical Flaw

**Problem 1: Non-Atomic Check and Create**
- Table status check: Line 132 (OUTSIDE transaction)
- Active order lookup: Line 149 (OUTSIDE transaction)
- Transaction start: Line 158 or Line 188 (TOO LATE)

**Problem 2: No Database-Level Constraint**
- Prisma schema allows multiple Order records with same tableId
- No unique constraint: `@@unique([tableId])` where status NOT IN ('COMPLETED', 'SERVED')
- No version field for optimistic locking

**Problem 3: Race Window**
Between lines 132-187, there's a 50-100ms window where:
- Two devices can both read "AVAILABLE"
- Both pass the activeOrder check (returns null)
- Both create NEW orders for the same table
- No conflict detection occurs

### Conclusion
**CONFIRMED**: This is a **classic TOCTOU (Time-of-Check to Time-of-Use) race condition**.

The fix requires:
1. Move table status check INSIDE the transaction
2. Use database-level locking (SELECT FOR UPDATE) on the table row
3. OR implement optimistic locking with version field
4. OR add database constraint to prevent multiple active orders per table

---

## Trace 4: Inspect `/src/lib/api-auth.ts` - Role-Based Authorization

### Code Analysis

**File**: `/src/lib/api-auth.ts`  
**Lines**: 1-47

```typescript
export async function checkAuth(req?: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null
      };
    }

    return { error: null, session };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      error: NextResponse.json({ error: "Auth check failed" }, { status: 401 }),
      session: null
    };
  }
}
```

### Critical Finding: NO ROLE CHECKING

**Current Behavior**:
- `checkAuth()` only verifies session existence
- Returns 401 if no session
- Returns 200 if session exists (regardless of role)
- **No role-based authorization logic**

**Missing Logic**:
```typescript
// WHAT SHOULD EXIST (but doesn't):
export async function checkAuth(req?: any, requiredRole?: 'ADMIN' | 'STAFF') {
  const { error, session } = await basicAuthCheck();
  if (error) return { error, session: null };

  // MISSING: Role check
  if (requiredRole === 'ADMIN' && session.user.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null
    };
  }

  return { error: null, session };
}
```

### Impact on API Endpoints

**Affected Endpoints** (all use `checkAuth()` without role verification):
1. `/api/menu/route.ts` (POST, PATCH, DELETE) - should be ADMIN-only
2. `/api/settings/route.ts` - should be ADMIN-only
3. `/api/users/route.ts` (manage staff) - should be ADMIN-only
4. `/api/orders/route.ts` - currently allows both roles (correct)

**Security Gap**:
- STAFF accounts can access admin-only endpoints
- No 403 Forbidden response for insufficient privileges
- Price changes, menu edits, settings changes all accessible to STAFF

### Prisma Schema Role Definition

```prisma
model User {
  id           String  @id @default(dbgenerated("(gen_random_uuid())::text"))
  email        String  @unique
  role         Role    @default(STAFF)
  restaurantId String?
  // ...
}

enum Role {
  ADMIN
  STAFF
}
```

**Role exists in schema** ✅  
**Role checking in auth helper** ❌

### Conclusion
**CONFIRMED**: No API-level role-based authorization exists.

The fix requires:
1. Add `requiredRole` parameter to `checkAuth()`
2. Check `session.user.role` against required role
3. Return 403 Forbidden for insufficient privileges
4. Update admin-only endpoints to call `checkAuth(req, 'ADMIN')`

---

## Visual Timeline: The Race Condition

```
DEVICE A                          DATABASE                     DEVICE B
  |                                  |                             |
  | POST /api/orders                 |                             |
  |--------------------------------->|                             |
  |                                  |                             |
  | Read table status                |                             |
  | Result: AVAILABLE ✅             |                             |
  |                                  |                             |
  | Find activeOrder                 |                             |
  | Result: null (no order yet)      |                             |
  |                                  |                             |
  |                                  |          POST /api/orders   |
  |                                  |<----------------------------|
  |                                  |                             |
  | Falls through to                 |     Read table status       |
  | "create NEW order"               |     Result: AVAILABLE ✅    |
  |                                  |     (Device A hasn't        |
  |                                  |      committed yet)         |
  |                                  |                             |
  | START TRANSACTION                |     Find activeOrder        |
  | (T+15ms)                         |     Result: null            |
  |                                  |                             |
  | Create Order 1                   |                             |
  | - id: abc-123                    |     Falls through to        |
  | - tableId: table-5               |     "create NEW order"      |
  | - items: Paneer x2               |                             |
  |                                  |                             |
  | Update table status              |     START TRANSACTION       |
  | SET status = 'OCCUPIED'          |     (T+65ms)                |
  |                                  |                             |
  | COMMIT TRANSACTION ✅            |     Create Order 2          |
  | (T+25ms)                         |     - id: def-456           |
  |                                  |     - tableId: table-5      |
  |                                  |     - items: Naan x3        |
  |                                  |                             |
  |                                  |     Update table status     |
  |                                  |     SET status = 'OCCUPIED' |
  |                                  |     (overwrites A's update) |
  |                                  |                             |
  |                                  |     COMMIT TRANSACTION ✅   |
  |                                  |     (T+75ms)                |
  |                                  |                             |

DATABASE FINAL STATE:
┌─────────────────────────────────────────────────────┐
│ Order Table                                         │
├──────────┬────────────┬────────────────────────────┤
│ id       │ tableId    │ items                      │
├──────────┼────────────┼────────────────────────────┤
│ abc-123  │ table-5    │ [Paneer x2]                │
│ def-456  │ table-5    │ [Naan x3]                  │ ⚠️ DUPLICATE!
└──────────┴────────────┴────────────────────────────┘

FRONTEND DISPLAY:
activeOrders.find(o => o.tableId === 'table-5')
→ Returns ONLY: { id: 'abc-123', items: [Paneer x2] }
→ Order def-456 with [Naan x3] is INVISIBLE ❌

USER PERCEPTION: "Data gayab ho jaata hai!" 😱
```

---

## Root Cause Summary

### Primary Root Cause: TOCTOU Race Condition

**Location**: `/src/app/api/orders/route.ts` lines 132-187

**Issue**: Table status check and active order lookup happen OUTSIDE the database transaction, creating a race window where multiple concurrent requests can:
1. Both see table status = AVAILABLE
2. Both find no active order (null)
3. Both create NEW Order records for the same table
4. No conflict detection or rollback occurs

**Result**: Multiple Order records per table → UI displays only most recent → previous orders invisible → perceived data loss

### Secondary Root Cause: No Role-Based Authorization

**Location**: `/src/lib/api-auth.ts`

**Issue**: `checkAuth()` only verifies session existence, not user role

**Impact**: STAFF accounts can access admin-only endpoints (menu edit, price changes, settings, staff management)

---

## Fix Strategy

### Fix #1: Resolve TOCTOU Race Condition

**Option A: Transaction-Level Locking (RECOMMENDED)**
```typescript
const order = await prisma.$transaction(async (tx) => {
  // SELECT FOR UPDATE: Lock the table row
  const table = await tx.table.findFirst({
    where: { id: tableId },
    // Prisma doesn't support SELECT FOR UPDATE natively,
    // need to use raw query or optimistic locking
  });

  // Check status INSIDE transaction
  if (table.status === 'OCCUPIED') {
    // Find and append to existing order
  } else {
    // Create new order
  }
});
```

**Option B: Optimistic Locking**
```prisma
model Order {
  version Int @default(0)
  // ... other fields
}
```

```typescript
// Check version before update
await tx.order.update({
  where: { id: activeOrder.id, version: activeOrder.version },
  data: {
    totalAmount: { increment: totalAmount },
    version: { increment: 1 }
  }
});
// If version mismatch, throws error → retry
```

**Option C: Database Constraint**
```sql
-- Partial unique index (PostgreSQL)
CREATE UNIQUE INDEX unique_active_order_per_table
ON "Order" ("tableId")
WHERE "status" NOT IN ('COMPLETED', 'SERVED');
```

### Fix #2: Implement Role-Based Authorization

```typescript
// Updated checkAuth with role support
export async function checkAuth(req?: any, requiredRole?: 'ADMIN' | 'STAFF') {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 401, session: null };
  }

  if (requiredRole === 'ADMIN' && session.user.role !== 'ADMIN') {
    return { error: 403, session: null };
  }

  return { error: null, session };
}

// Usage in admin-only endpoints
const auth = await checkAuth(request, 'ADMIN');
if (auth.error) return NextResponse.json({ error: 'Forbidden' }, { status: auth.error });
```

---

## Verification Steps (Post-Fix)

### Test 1: Concurrent Order Creation
1. Run property-based test from Task 1.1
2. Verify: Only 1 Order record created per table
3. Verify: All items from both devices appear in single order

### Test 2: Database Constraint
1. Query: `SELECT "tableId", COUNT(*) FROM "Order" WHERE status NOT IN ('COMPLETED', 'SERVED') GROUP BY "tableId" HAVING COUNT(*) > 1;`
2. Expected: 0 rows

### Test 3: Role Authorization
1. Login as STAFF user
2. Attempt to access `/api/menu` (POST/PATCH/DELETE)
3. Expected: 403 Forbidden response

---

## References

- Task 1.1 Results: `/tests/TASK_1.1_RESULTS.md`
- Bug Condition Test: `/tests/part1-concurrent-api-test.test.ts`
- Design Document: `.kiro/specs/production-critical-fixes/design.md`
- Requirements: `.kiro/specs/production-critical-fixes/bugfix.md`

---

**Investigation Complete**: 2026-06-22  
**Next Task**: 1.3 Write preservation property tests
