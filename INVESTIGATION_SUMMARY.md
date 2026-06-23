# Investigation Summary: Concurrent Session Data Loss Bug

**Date**: 2026-06-22  
**Status**: ✅ ROOT CAUSE IDENTIFIED  
**Priority**: 🔴 CRITICAL

---

## Quick Summary

**Problem**: Staff using same login on two laptops experience "data gayab ho jaata hai" (data disappears)

**Root Cause**: TOCTOU (Time-of-Check to Time-of-Use) race condition in `/src/app/api/orders/route.ts`

**Impact**: Multiple Order records created for same table → Frontend displays only first → Other orders invisible

---

## The Bug in 3 Steps

### Step 1: Race Condition in API (Backend)
- Line 132: Check table status **OUTSIDE transaction**
- Line 149: Find active order **OUTSIDE transaction**
- Line 158/188: Start transaction **TOO LATE**
- Result: Two devices both create NEW orders for same table

### Step 2: Multiple Orders in Database
```sql
SELECT * FROM "Order" WHERE "tableId" = 'table-5' AND status != 'COMPLETED';

-- Result:
-- Order abc-123: 2 items (Paneer Tikka)
-- Order def-456: 3 items (Naan)
```

### Step 3: Frontend Shows Only One Order
```typescript
// dashboard.tsx line 419
activeOrders.find(o => o.tableId === selectedTable.id)
// ↑ Returns ONLY first match!
```

**User Experience**: Adds 2 items → switches laptop → adds 3 items → **sees only 2 items** → "data gayab!"

---

## Affected Files

### 🔴 Critical (Must Fix)
1. `/src/app/api/orders/route.ts` (lines 132-187)
   - TOCTOU race condition
   - Table status check outside transaction

2. `/src/lib/api-auth.ts`
   - No role-based authorization
   - STAFF can access admin endpoints

### 🟡 Secondary (Should Fix)
3. `/src/components/dashboard/dashboard.tsx` (line 419)
   - `.find()` returns only first order
   - Should handle multiple orders or prevent them

---

## Fix Strategy

### Fix #1: Transaction-Level Table Locking (RECOMMENDED)

**Approach**: Move table status check INSIDE transaction + use database constraint

```typescript
// BEFORE (BROKEN):
if (table && table.status === 'OCCUPIED') {  // ❌ Outside transaction
  const activeOrder = await prisma.order.findFirst(...);  // ❌ Outside transaction
  
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Transaction starts HERE (too late!)
  });
}

// AFTER (FIXED):
const order = await prisma.$transaction(async (tx) => {
  // ✅ Check table status INSIDE transaction
  const table = await tx.table.findFirst({
    where: { id: tableId }
  });
  
  if (table.status === 'OCCUPIED') {
    // ✅ Find active order INSIDE transaction
    const activeOrder = await tx.order.findFirst({
      where: { tableId, status: { notIn: ['COMPLETED', 'SERVED'] } }
    });
    
    if (activeOrder) {
      // Append to existing order
    }
  }
  
  // Create new order if needed
});
```

### Fix #2: Database Constraint (Additional Safety)

Add unique constraint to prevent multiple active orders per table:

```sql
CREATE UNIQUE INDEX unique_active_order_per_table
ON "Order" ("tableId")
WHERE "status" NOT IN ('COMPLETED', 'SERVED');
```

This ensures even if race condition occurs, database will reject duplicate with error.

### Fix #3: Role-Based Authorization

```typescript
// api-auth.ts
export async function checkAuth(req?: any, requiredRole?: 'ADMIN' | 'STAFF') {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 401, session: null };
  }

  // ✅ Add role check
  if (requiredRole === 'ADMIN' && session.user.role !== 'ADMIN') {
    return { error: 403, session: null };
  }

  return { error: null, session };
}
```

---

## Test Results

### Task 1.1: Bug Condition Exploration Test
- **Status**: ✅ PASSED (bug reproduced)
- **File**: `/tests/part1-concurrent-api-test.test.ts`
- **Counterexample Found**: 5 concurrent requests → 5 separate orders created

### Task 1.2: Investigation Complete
- **Trace 1**: ✅ Reproduced data loss locally
- **Trace 2**: ✅ Confirmed multiple orders in database
- **Trace 3**: ✅ Identified TOCTOU race condition (lines 132-187)
- **Trace 4**: ✅ Confirmed no role-based authorization exists

---

## Next Steps

### Immediate (Task 1.3)
- [ ] Write preservation property tests
- [ ] Ensure fix doesn't break existing functionality

### Implementation (Task 1.4)
- [ ] Implement transaction-level locking
- [ ] Add database constraint
- [ ] Implement role-based authorization
- [ ] Re-run Task 1.1 test to verify fix

### Verification
- [ ] Confirm only 1 order per table in database
- [ ] Test concurrent operations (2+ devices)
- [ ] Verify STAFF role cannot access admin endpoints
- [ ] Check all preservation tests pass

---

## References

- **Full Investigation**: `/TASK_1.2_INVESTIGATION_REPORT.md`
- **Test Results**: `/tests/TASK_1.1_RESULTS.md`
- **Design Document**: `.kiro/specs/production-critical-fixes/design.md`
- **Bug Requirements**: `.kiro/specs/production-critical-fixes/bugfix.md`

---

**Investigation Lead**: Kiro AI  
**Confidence Level**: 🟢 HIGH (100% reproducible, root cause confirmed)
