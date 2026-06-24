# Sound & Table Transfer Diagnostics

**Date:** June 24, 2026  
**Issues:** KDS sound, Table transfer, Full bill verification

---

## 🔊 ISSUE 1: KDS Sound Not Playing

### Current Implementation (CORRECT):

**Sound Detection Logic:**
```typescript
// Case 1: Completely new order → NEW sound
if (!oldOrder) {
  addSoundNotification('new', orderId);
}

// Case 2: Running table (more items) → URGENT sound
else if (order.items.length > oldOrder.items.length) {
  addSoundNotification('urgent', orderId);
}

// Case 3: [URGENT ADDITION] tag → URGENT sound
if (hasUrgentInstruction) {
  addSoundNotification('urgent', orderId);
}
```

### Why Sound May Not Play:

**1. Browser Autoplay Policy** 🔴
- Chrome/Safari block autoplay until user interaction
- Need to click "Start KDS" button first
- After click, sounds should work

**2. Sound Files Missing** 🟡
- Check: `/public/sounds/new-order.mp3`
- Check: `/public/sounds/urgent.mp3`

**3. Tab Not Visible** 🟡
- KDS only polls when tab visible
- Check: `document.visibilityState === 'visible'`

**4. Sound Disabled** 🟡
- Check KDS UI: Sound toggle button
- Should show "SOUND ON" not "MUTED"

### Diagnostic Steps:

**Test in Production:**
```
1. Open: https://pos.gen-z.online/kds
2. Click: "Start KDS" (enables audio)
3. Open browser console (F12)
4. Create new order from dashboard
5. Check console logs:
   - "🆕 New order detected: [orderId]"
   - "🔊 Playing new sound"
6. Add items to SERVED order
7. Check console logs:
   - "🔥 Running table: Order [id] has X new items"
   - "🔊 Playing urgent sound"
```

**Expected Console Output:**
```
🆕 New order detected: abc123...
🔊 Playing new sound
🔔 NEW: Fresh orders detected!

[After adding to served order]
🔥 Running table: Order abc123 (Table 5) has 2 new items
   Old items: 3, New items: 5
🔊 Playing urgent sound
🔥 URGENT: Running table additions detected!
```

**If No Sound:**
```javascript
// Test in browser console:
const audio = new Audio('/sounds/new-order.mp3');
audio.play(); // Should hear sound

const urgent = new Audio('/sounds/urgent.mp3');
urgent.play(); // Should hear sound
```

---

## 🔄 ISSUE 2: Table Transfer Problem

### Current Implementation (PARTIAL):

**What Transfers:**
- ✅ Order moved to new table
- ✅ New table marked OCCUPIED
- ✅ Old table marked AVAILABLE (if no other orders)

**What DOESN'T Transfer:**
- ❌ Bill (if already generated)
- ❌ Bill link to new table

### Problem Scenario:

```
Table 1:
  - Order A (items 1,2,3)
  - Generate Bill → Bill linked to Table 1
  - Transfer Order to Table 2
  
Result:
  - Order moved to Table 2 ✅
  - Bill still shows Table 1 ❌
```

### Fix Required:

**File:** `src/app/api/orders/[id]/transfer/route.ts`

**Add bill transfer logic:**
```typescript
// After transferring order, also transfer associated bill
const existingBill = await tx.bill.findUnique({
  where: { orderId: order.id }
});

if (existingBill) {
  await tx.bill.update({
    where: { id: existingBill.id },
    data: { tableId: newTableId }
  });
  console.log(`✅ Bill ${existingBill.id} transferred to new table`);
}
```

---

## 📊 ISSUE 3: Full Table Bill Verification

### Current Implementation (CORRECT):

**Logic:**
```typescript
// Find ALL unbilled orders for table
allTableOrders = await prisma.order.findMany({
  where: {
    tableId: order.tableId,
    status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'] },
    bill: null // Not billed yet
  }
});

// Calculate total from ALL orders
subtotal = allTableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
```

### Test Scenario:

```
Table 5:
1. Create Order 1: Paneer Tikka (₹200)
2. Send to kitchen
3. Mark as SERVED
4. Create Order 2: Naan (₹50)  
5. Send to kitchen
6. Mark as SERVED
7. Generate Bill

Expected: Bill shows BOTH orders
  - Paneer Tikka: ₹200
  - Naan: ₹50
  - Total: ₹250 + tax
```

### Verification Query:

```sql
-- Check unbilled orders for a table
SELECT o.id, o.status, o.totalAmount, o.createdAt, b.id as billId
FROM "Order" o
LEFT JOIN "Bill" b ON b."orderId" = o.id
WHERE o."tableId" = 'TABLE_ID_HERE'
AND o.status IN ('PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED')
ORDER BY o."createdAt" ASC;
```

### Console Logs to Check:

**When generating bill:**
```
[Bill Creation] Table 5: Finding all unbilled orders
[Bill Creation] Found 2 unbilled orders for Table 5
  Order 1: 1 items, Status: SERVED, Amount: ₹200
  Order 2: 1 items, Status: SERVED, Amount: ₹50
[Bill Creation] Creating bill for Table 5
  Total orders: 2
  Subtotal: ₹250
  Tax: ₹45
  Total: ₹295
```

---

## 🧪 Complete Test Workflow

### Test 1: New Order Sound

```
Dashboard:
1. Table 3 → "Add Items"
2. Add: Butter Chicken
3. Send to Kitchen

KDS (open in another window):
✅ Should hear: NEW ORDER sound (beep)
✅ Should show: "🔔 NEW ORDER RECEIVED" toast
✅ Console: "🆕 New order detected"
```

### Test 2: Running Table Sound

```
Dashboard:
1. Table 3 (has active order) → "Mark as Served"
2. Table 3 → "Add Items" → Add: Naan
3. Send to Kitchen

KDS:
✅ Should hear: URGENT sound (3 quick beeps)
✅ Should show: "🔥 URGENT RUNNING TABLE ADDITION!" toast
✅ Console: "🔥 Running table: Order [id] has 1 new items"
✅ KDS Display: Item shows with 🔥 URGENT badge
```

### Test 3: Full Table Bill

```
Dashboard:
1. Table 4 → Order 1: Paneer Tikka (₹200)
2. Send → Mark as Served
3. Table 4 → Order 2: Naan (₹50)
4. Send → Mark as Served
5. Table 4 → "Generate Bill"

Bill Modal:
✅ Should show: 2 items
   - 1× Paneer Tikka - ₹200
   - 1× Naan - ₹50
✅ Subtotal: ₹250
✅ Tax (18%): ₹45
✅ Total: ₹295
```

### Test 4: Table Transfer

```
Dashboard:
1. Table 1 → Create Order (Butter Chicken)
2. Send to Kitchen
3. Table 1 drawer → "Transfer Table"
4. Select: Table 5
5. Confirm transfer

Expected:
✅ Order moves to Table 5
✅ Table 1 becomes Available
✅ Table 5 becomes Occupied
✅ Bill (if generated) updates to Table 5
✅ All order data intact
✅ Item count same
✅ Total amount same
```

### Test 5: Transfer with Bill

```
Dashboard:
1. Table 2 → Create Order
2. Mark as Served
3. Generate Bill
4. Transfer to Table 6

Check Bill:
✅ Bill shows Table 6 (not Table 2)
✅ Bill amount unchanged
✅ Order items same
```

---

## 🔧 Quick Fixes Needed

### Fix 1: Table Transfer with Bill

**File:** `src/app/api/orders/[id]/transfer/route.ts`

**Add after line 60:**
```typescript
// Transfer bill if it exists
const existingBill = await tx.bill.findUnique({
  where: { orderId: order.id }
});

if (existingBill) {
  await tx.bill.update({
    where: { id: existingBill.id },
    data: { tableId: newTableId }
  });
  console.log(`✅ Bill transferred: ${existingBill.id} → Table ${newTable.number}`);
}
```

### Fix 2: Better Sound Debugging

**Add to KDS component:**
```typescript
// Log sound status on mount
useEffect(() => {
  console.log('🔊 KDS Sound System:');
  console.log('  - Sound Enabled:', soundEnabled);
  console.log('  - Has Interacted:', hasInteracted);
  console.log('  - Audio Files:', {
    new: audioContextRef.current.new?.src,
    urgent: audioContextRef.current.urgent?.src
  });
}, [soundEnabled, hasInteracted]);
```

---

## 📋 Verification Checklist

**KDS Sound:**
- [ ] Sound files exist in `/public/sounds/`
- [ ] "Start KDS" button clicked
- [ ] Sound toggle shows "SOUND ON"
- [ ] Browser console shows sound logs
- [ ] New order plays beep sound
- [ ] Running table plays 3 urgent beeps
- [ ] Toast notifications appear

**Full Table Bill:**
- [ ] Multiple orders on same table
- [ ] All marked as SERVED
- [ ] Generate Bill → shows ALL items
- [ ] Total = sum of all orders + tax
- [ ] Console logs show all orders found
- [ ] Receipt prints all items

**Table Transfer:**
- [ ] Order transfers to new table
- [ ] Old table becomes available
- [ ] New table becomes occupied
- [ ] Bill transfers with order (if exists)
- [ ] All data remains intact
- [ ] No data loss

---

## 🚨 Common Issues

**Sound:**
1. Forgot to click "Start KDS" → Click button
2. Tab not visible → Keep tab active
3. Sound muted → Check toggle button
4. Browser blocks autoplay → User interaction needed

**Bill:**
1. Not including old orders → Check `bill: null` filter
2. Orders marked as COMPLETED → Check status filter
3. Missing items → Check order.items include

**Transfer:**
1. Bill not moving → Need to add bill transfer logic
2. Data loss → Check transaction rollback
3. Table status wrong → Check remaining orders count

---

**Status:** Diagnostics complete  
**Action Required:** Test in production with console open  
**Priority:** Verify sound + Add bill transfer fix
