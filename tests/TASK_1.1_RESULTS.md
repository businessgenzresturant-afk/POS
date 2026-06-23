# Task 1.1: Bug Condition Exploration Test Results

## Status: ✅ COMPLETE - Bug Successfully Reproduced

## Test Details

**Task**: Write bug condition exploration test - Concurrent Session Data Loss  
**Requirements Validated**: 1.1, 1.2, 1.3  
**Test File**: `tests/part1-concurrent-api-test.test.ts`  
**Test Status**: **FAILED (as expected)** - Confirms bug exists

## Counterexamples Found

### Counterexample 1: Data Loss from Concurrent Operations

```
Scenario: Two devices add items concurrently to the same table
- Device A: Adds 1 item (2 quantity)
- Device B: Adds 1 item (3 quantity)  
- Timing: Within 52ms (< 5 seconds)

Expected: 2 items in database
Actual:   1 item in database
Result:   🔴 DATA LOSS - 1 item disappeared
```

### Counterexample 2: Multiple Orders Created (Root Cause Identified)

```
Scenario: 5 concurrent requests to same table
- All devices see table status: AVAILABLE
- Each device creates a NEW order

Expected: 1 order with 5 items
Actual:   5 separate orders (1 item each)
Result:   🔴 BUG CONFIRMED - Multiple orders for same table
```

## Root Cause Analysis

### The Race Condition

Location: `/src/app/api/orders/route.ts` lines 174-185

```typescript
// Line 174: Check happens OUTSIDE transaction
if (table && table.status === 'OCCUPIED') {
  // Line 176-182: Find order OUTSIDE transaction
  const activeOrder = await prisma.order.findFirst({
    where: {
      tableId,
      status: { notIn: ['COMPLETED', 'SERVED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (activeOrder) {
    // Line 185: Transaction starts HERE (too late!)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Append items...
    });
  }
}
```

### The Problem

1. **Device A**: Checks `table.status === 'AVAILABLE'` ✅ (at time T)
2. **Device B**: Checks `table.status === 'AVAILABLE'` ✅ (at time T+50ms, before A commits)
3. **Device A**: Enters transaction, creates NEW order, sets table to `OCCUPIED` (at time T+20ms)
4. **Device B**: Enters transaction, creates ANOTHER NEW order (because it saw AVAILABLE), sets table to `OCCUPIED` (at time T+70ms)

### Result

- **Multiple Order records** created for the same table
- In the production UI, only the **LAST order** is displayed
- Previous orders' items are still in the database but **invisible to users**
- This causes the reported "**data gayab ho jaata hai**" (data disappears) effect

## Why This Happens

The critical flaw is that:
1. The table status check happens **OUTSIDE the transaction**
2. The active order lookup happens **OUTSIDE the transaction**
3. By the time the transaction starts, another concurrent request may have passed the same checks

This creates a **Time-of-Check to Time-of-Use (TOCTOU)** race condition.

## Impact on Production

- Staff using two laptops with same credentials experience data loss
- Items added from one laptop appear to disappear when the other laptop adds items
- This causes confusion and operational problems
- The data exists in the database but is split across multiple Order records

## Fix Strategy (For Task 1.4)

The fix will require:

1. **Option A: Optimistic Locking**
   - Add `version` field to Order model
   - Check version before updates
   - Detect conflicts and retry

2. **Option B: Database-Level Locking**
   - Use SELECT FOR UPDATE on table status check
   - Lock the table row during the check and order creation

3. **Option C: Atomic Table Status + Order Creation**
   - Move table status check INSIDE the transaction
   - Use database constraints to prevent duplicate active orders per table

## Test Coverage

The test includes:

✅ **Bug Condition Test**: Simulates concurrent operations with precise timing  
✅ **Stress Test**: 5 concurrent requests to maximize race condition likelihood  
✅ **Counterexample Documentation**: Clear output showing what disappeared  
✅ **Root Cause Identification**: Pinpoints exact code location and logic flaw  

## Next Steps

1. ✅ Task 1.1 Complete - Bug confirmed and documented
2. → Task 1.2: Investigate concurrent session bug root cause (informed by these findings)
3. → Task 1.3: Write preservation property tests
4. → Task 1.4: Implement fix using optimistic locking or transaction-level checks

## Notes

- Initial test approach (direct Prisma calls) did NOT reproduce the bug
- Updated approach (simulating actual API flow) successfully reproduced it
- This highlights the importance of testing at the correct abstraction level
- The bug is a **classic TOCTOU race condition** in concurrent systems
