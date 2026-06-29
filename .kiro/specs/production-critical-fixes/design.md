# Production Critical Fixes - Bugfix Design

## Overview

This design addresses 8 critical production bugs in the GenZ Restaurant POS system (pos.gen-z.online), a LIVE Next.js 14 + Prisma application. The highest priority is Part 1: concurrent session data corruption that causes data loss when the same account logs in on two devices simultaneously. Part 8 involves interconnected bugs in running table, table transfer, and KDS urgent detection that require deep code tracing to identify actual root causes.

**Critical Context**: Past sessions repeatedly claimed fixes worked but bugs persist in production. This design includes specific investigation methodologies and code tracing steps to identify actual root causes before implementing fixes.

**System Architecture**: Next.js 14 App Router + Prisma ORM + PostgreSQL + NextAuth session-based authentication

**Fix Strategy**: Systematic investigation → Root cause identification → Targeted implementation → Comprehensive testing

## Glossary

- **Bug_Condition (C)**: For each part, the specific input condition that triggers the defective behavior
- **Property (P)**: The desired correct behavior when bug condition holds
- **Preservation**: Existing working functionality that must remain unchanged
- **Session Isolation**: Ensuring concurrent sessions with same credentials don't cause data overwrites
- **Running Table**: Adding new items to an already-occupied table with an existing active order
- **Table Transfer**: Moving an order from one table to another while preserving all order data
- **KDS Urgent Detection**: Kitchen Display System logic that identifies new items added to running orders
- **Order Entity**: Database Order record (one per table session, can have multiple OrderItem entities)
- **OrderItem Entity**: Individual menu item instance within an Order
- **STAFF Role**: Limited access role for order-taking devices (cannot edit menu, prices, settings)
- **ADMIN Role**: Full access role for business owner account
- **API-Level Authorization**: Server-side enforcement of role-based access control at endpoint level
- **Optimistic Locking**: Conflict detection using version numbers to prevent concurrent write overwrites
- **Merge Logic**: Client-side strategy to reconcile server updates with local state changes
- **UPI**: Unified Payments Interface - digital payment method (user has physical QR code, system records label only)

## Bug Details

### Part 1: Data Corruption - Concurrent Session Isolation

#### Bug Condition

The bug manifests when two devices using the same account credentials (business.genzresturant@gmail.com) make concurrent operations on orders, causing silent data loss ("data gayab ho jaata hai").

**Formal Specification:**
```
FUNCTION isBugCondition_Part1(sessionA, sessionB, operationA, operationB)
  INPUT: two sessions (sessionA, sessionB), two operations (operationA, operationB)
  OUTPUT: boolean
  
  RETURN sessionA.userId == sessionB.userId
         AND operationA.type IN ['order_create', 'order_update', 'order_item_add']
         AND operationB.type IN ['order_create', 'order_update', 'order_item_add']
         AND abs(operationA.timestamp - operationB.timestamp) < 5000  // within 5 seconds
         AND (operationA.tableId == operationB.tableId OR operationA.orderId == operationB.orderId)
END FUNCTION
```

#### Examples

- **Laptop A**: Staff adds 2 items to Table 5 order at 12:00:00
- **Laptop B**: Staff adds 3 items to Table 5 order at 12:00:02
- **Actual Behavior**: Only the 3 items from Laptop B appear in the order (2 items disappeared)
- **Expected Behavior**: All 5 items should appear in the order


### Part 2: Manage Menu - Missing Edit/Category Features

#### Bug Condition

The bug manifests when attempting to modify existing menu item properties (price, name, category, dietType, stock status) - no UI or API endpoint exists for editing.

**Formal Specification:**
```
FUNCTION isBugCondition_Part2(action, menuItem)
  INPUT: action type, menuItem entity
  OUTPUT: boolean
  
  RETURN action == 'EDIT_MENU_ITEM'
         AND menuItem.exists == true
         AND (userWantsToChange(menuItem.price) 
              OR userWantsToChange(menuItem.name)
              OR userWantsToChange(menuItem.category)
              OR userWantsToChange(menuItem.dietType)
              OR userWantsToChange(menuItem.hasHalfFullOption))
END FUNCTION
```

#### Examples

- **Action**: Admin wants to increase "Paneer Butter Masala" price from ₹180 to ₹200
- **Actual Behavior**: No "Edit" button exists in ManageMenuModal, only "Mark Unavailable" and "Delete"
- **Expected Behavior**: Edit button opens form pre-filled with current values, allows modification


### Part 3: Service Charge Toggle - Wrong Location

#### Bug Condition

The bug manifests when staff need to toggle service charge during payment collection - toggle is not present in the Payment Collection modal where GST toggle is located.

**Formal Specification:**
```
FUNCTION isBugCondition_Part3(modalOpen, userNeedsServiceCharge)
  INPUT: modal state, user intent
  OUTPUT: boolean
  
  RETURN modalOpen == 'PaymentModal'
         AND userNeedsServiceCharge == true
         AND serviceChargeToggle NOT IN PaymentModal.controls
END FUNCTION
```

#### Examples

- **Action**: Staff collecting payment for Table 3, customer agrees to 10% service charge
- **Actual Behavior**: No toggle or checkbox for service charge in PaymentModal (current location unknown or non-existent)
- **Expected Behavior**: Service charge toggle appears below GST toggle, recalculates total in real-time


### Part 4: UPI Payment Method - Missing Option

#### Bug Condition

The bug manifests when staff need to record UPI payment (user has physical QR code posted at counter) - only "Cash" and "Card" buttons exist in PaymentModal.

**Formal Specification:**
```
FUNCTION isBugCondition_Part4(paymentMethod, paymentOptions)
  INPUT: customer's payment method, available UI options
  OUTPUT: boolean
  
  RETURN paymentMethod == 'UPI'
         AND 'UPI' NOT IN paymentOptions
END FUNCTION
```

#### Examples

- **Action**: Customer scans QR code and pays ₹450 via UPI, staff needs to record payment
- **Actual Behavior**: Only "Cash" (💵) and "Card" (💳) buttons exist, staff forced to select Cash incorrectly
- **Expected Behavior**: "UPI" button (could use 📱 icon) available, stores `paymentMethod: 'UPI'` in bill record


### Part 5: Revenue Report - No Payment Method Breakdown

#### Bug Condition

The bug manifests when viewing revenue reports - only total revenue is shown without breakdown by payment method (Cash/UPI/Card).

**Formal Specification:**
```
FUNCTION isBugCondition_Part5(report, paymentMethods)
  INPUT: revenue report data, payment methods used
  OUTPUT: boolean
  
  RETURN report.hasBreakdown == false
         AND paymentMethods.length > 1
         AND userNeedsToSee('payment_method_breakdown')
END FUNCTION
```

#### Examples

- **Scenario**: Today's revenue: 5 Cash bills (₹2000), 3 UPI bills (₹1500), 2 Card bills (₹800)
- **Actual Behavior**: Report shows "Total: ₹4300" only
- **Expected Behavior**: Report shows "Cash: ₹2000 · UPI: ₹1500 · Card: ₹800 · Total: ₹4300"


### Part 6: Receipt Format - No Watermark, Wrong Sizing

#### Bug Condition

The bug manifests when printing receipts to 80mm thermal printer - no background watermark logo, paper size causes misalignment, non-monospace font causes price misalignment.

**Formal Specification:**
```
FUNCTION isBugCondition_Part6(receipt, printer)
  INPUT: receipt HTML/CSS, printer specifications
  OUTPUT: boolean
  
  RETURN receipt.hasBackgroundWatermark == false
         OR receipt.pageSize != '80mm auto'
         OR receipt.containerWidth != '72mm'
         OR receipt.fontFamily != 'monospace'
END FUNCTION
```

#### Examples

- **Issue 1**: Printed receipt has no Gen-z-logo.png watermark in background (only header logo exists)
- **Issue 2**: Receipt prints wider than 80mm thermal paper, causing cut-off or misalignment
- **Issue 3**: Item prices and totals not aligned properly due to proportional font


### Part 7: Order Placement Speed - Real Latency

#### Bug Condition

The bug manifests when clicking "Send to Kitchen" - the operation is genuinely slow (not just UI perception).

**Formal Specification:**
```
FUNCTION isBugCondition_Part7(operation)
  INPUT: order creation/update operation
  OUTPUT: boolean
  
  RETURN operation.type == 'SEND_TO_KITCHEN'
         AND operation.latency > 1500  // milliseconds
         AND bottleneckExists(operation.trace)
END FUNCTION
```

#### Potential Bottlenecks to Investigate

1. **Sequential Database Operations**: Order creation, table update, stock updates may be sequential instead of batched
2. **Prisma Client Instantiation**: Non-singleton pattern causing connection overhead per request
3. **Large Response Payload**: API returns unnecessary nested data (full menu item objects, etc.)
4. **Client-Side Computation**: Heavy synchronous processing before sending request


### Part 8: Running Table / Table Transfer / KDS Urgent - Interconnected Bugs

#### Bug Condition - Symptom A: Running Table Items Not Showing Together

The bug manifests when adding new items to an occupied table that already has an active order - not all items (old + new) display together.

**Formal Specification:**
```
FUNCTION isBugCondition_Part8A(table, order, newItems)
  INPUT: table entity, existing order, new items to add
  OUTPUT: boolean
  
  RETURN table.status == 'OCCUPIED'
         AND order.status IN ['PENDING', 'PREPARING']
         AND newItems.length > 0
         AND displayedItems.length != (order.items.length + newItems.length)
END FUNCTION
```

#### Bug Condition - Symptom B: Table Transfer Loses Items

The bug manifests when transferring table - not all items move to the new table, or subsequent additions don't show with transferred items.

**Formal Specification:**
```
FUNCTION isBugCondition_Part8B(oldTableId, newTableId, order)
  INPUT: source table ID, destination table ID, order to transfer
  OUTPUT: boolean
  
  RETURN orderTransferred == true
         AND (orderLookup(newTableId).items.length < order.items.length
              OR subsequentAdditions(newTableId) NOT IN orderLookup(newTableId).items)
END FUNCTION
```


#### Bug Condition - Symptom C: KDS Urgent Detection Intermittent

The bug manifests when KDS polls for updates after items added to running order - urgent sound and visual indicator only work intermittently.

**Formal Specification:**
```
FUNCTION isBugCondition_Part8C(previousPoll, currentPoll, order)
  INPUT: previous KDS poll data, current KDS poll data, order entity
  OUTPUT: boolean
  
  RETURN order.items.length > previousPoll.order.items.length  // new items added
         AND urgentDetection(order) == INTERMITTENT  // sometimes works, sometimes doesn't
         AND rootCause IN ['incomplete_order_data', 'wrong_item_count', 'lookup_key_mismatch']
END FUNCTION
```

#### Critical Investigation Notes

These 3 symptoms are INTERCONNECTED - fixing one may require fixing all three root causes:
1. If running table creates a SECOND Order instead of appending to existing Order → Symptom A occurs
2. If table transfer doesn't update ALL lookup keys → Symptom B occurs (subsequent adds find wrong/no order)
3. If KDS uses incomplete data from bugs #1 or #2 → Symptom C occurs (intermittent because data sometimes correct, sometimes split)


## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors** (must continue working exactly as before):
- Authentication via Google OAuth and email/password using NextAuth
- Order creation for new/empty tables (creates Order record, sets table OCCUPIED, stores OrderItems)
- Kitchen Display System basic display (shows active orders grouped by table)
- Bill generation with subtotal, GST, service charge (after Part 3 toggle added), total calculations
- Menu display in order-taking interface (all items with prices, categories, dietary types)
- Table status display (AVAILABLE/OCCUPIED/RESERVED, number, capacity)
- Revenue reports calculation (even before Part 5 breakdown, total must be correct)
- Receipt header and footer (restaurant name, address, bill number, date, footer text)
- Order status workflow (PENDING → PREPARING → READY → SERVED → COMPLETED)
- Database relationships and referential integrity (Orders with OrderItems, Bills with Orders, Tables with Orders)
- Menu item creation (not editing - that's Part 2 new feature)
- Protected routes (redirect to login without authentication)
- GST toggle in payment collection (recalculates total, saves gstApplied field)
- Cash payment method (stores paymentMethod: 'CASH' before UPI added in Part 4)

**Scope**: All operations NOT involving the 8 specific bug conditions should continue working identically to current production behavior.


## Hypothesized Root Causes

### Part 1: Data Corruption - Concurrent Session Isolation

Based on code analysis of `/src/app/api/orders/route.ts` POST endpoint and NextAuth session handling:

1. **Client-Side State Overwrite (MOST LIKELY)**: 
   - Two devices maintain separate local state (cart, order items)
   - Device A: holds items [X, Y] locally, sends POST request at T
   - Device B: holds items [A, B, C] locally, sends POST request at T+2
   - Both requests succeed independently at API level (no conflict detection)
   - BUT: If client refetches after submit, Device B's data replaces Device A's perception
   - This is NOT actually data loss at DB level, but race condition in client state management

2. **API-Level Race Condition in Running Table Logic**:
   - Lines 132-172 in `orders/route.ts`: checks if table OCCUPIED, finds active order
   - Device A checks → finds activeOrder (ID: abc123), starts appending items
   - Device B checks at same time → finds same activeOrder (ID: abc123)
   - Both devices call `tx.orderItem.createMany()` with same `orderId: abc123`
   - Both succeed, but `order.update()` increments totalAmount twice sequentially
   - No optimistic locking or version checking on Order entity
   - Result: All items created BUT no conflict detection, potential for state inconsistency

3. **No API-Level Authorization for STAFF Role**:
   - Current `/src/lib/api-auth.ts` only checks session existence, not role
   - STAFF users can access admin-only endpoints (menu edit, price changes, settings)
   - No separate STAFF accounts exist - both devices use same business.genzresturant@gmail.com ADMIN account


### Part 2: Manage Menu - Missing Edit Features

Based on code analysis of `/src/components/modals/ManageMenuModal.tsx` and `/src/app/api/menu/route.ts`:

1. **UI Missing Edit Button and Form**:
   - ManageMenuModal renders items with "Mark Unavailable" and "Delete" buttons only (lines 268-287)
   - No "Edit" button or edit form exists in the component
   - State management exists for `showAddForm` but no `showEditForm` state

2. **API Missing PATCH/PUT Endpoint**:
   - `/src/app/api/menu/route.ts` only has GET (fetch) and POST (create) methods
   - No PATCH handler for updating existing menu items
   - `/src/app/api/menu/[id]/route.ts` file likely missing or incomplete

3. **Category Selection Not Implemented**:
   - Add form line 218: uses plain text `<input type="text" placeholder="Category">
   - No dropdown/select showing existing categories
   - No category autocomplete or suggestion


### Part 3: Service Charge Toggle - Wrong Location

Based on code analysis of `/src/components/billing/PaymentModal.tsx`:

1. **Toggle Not Present in PaymentModal**:
   - GST toggle exists at lines 498-517 with proper state management (`gstApplied`)
   - No corresponding service charge toggle or state
   - No `serviceChargeApplied` state variable
   - No `serviceChargePercent` configuration

2. **Database Schema Missing Field**:
   - `prisma/schema.prisma` Bill model has `gstApplied Boolean @default(true)` field
   - No `serviceChargeApplied` field exists
   - Service charge amount not tracked separately in bill record

3. **Calculation Logic Not Implemented**:
   - `calculateFinalTotal()` helper function (line 18) includes GST in calculation
   - No service charge percentage applied to subtotal
   - Standard service charge in restaurant industry: 10% of subtotal (before GST)


### Part 4: UPI Payment Method - Missing Option

Based on code analysis of `/src/components/billing/PaymentModal.tsx`:

1. **UI Only Has Cash and Card Buttons**:
   - Lines 560-591: payment method selection grid has only 2 buttons (Cash, Card)
   - Third "Split" button for mixed payments exists
   - No UPI button (could use 📱 or QR code icon)

2. **Payment Method Enum Missing UPI**:
   - Current payment methods: 'CASH', 'CARD', 'SPLIT'
   - Bill schema `paymentMethod String?` field allows any string value
   - Need to standardize: 'CASH' | 'UPI' | 'CARD' | 'SPLIT'

3. **No QR Code Generation Needed**:
   - User requirement: restaurant has PHYSICAL QR code at counter
   - System only needs to RECORD that payment was via UPI (label only)
   - No integration with payment gateway required
   - Simple UI button and field update in bill record


### Part 5: Revenue Report - No Payment Method Breakdown

Based on code analysis of `/src/app/api/reports/route.ts`:

1. **API Only Returns Total Revenue**:
   - Lines 64-67: calculates `dailySalesTotal` by summing all bill.total amounts
   - No grouping by `bill.paymentMethod` field
   - Returns single number, not breakdown object

2. **Frontend Display Not Implemented**:
   - TodayRevenueModal (component path: `/src/components/dashboard/TodayRevenueModal.tsx`)
   - Likely displays only single total number
   - No separate lines for Cash/UPI/Card/Split amounts

3. **Simple SQL Aggregation Needed**:
   - Group bills by `paymentMethod` field
   - Sum `total` for each group
   - Return object: `{ cash: number, upi: number, card: number, split: number, total: number }`
   - For split payments: allocate to separate cash/online totals using `cashAmount` and `onlineAmount` fields


### Part 6: Receipt Format - No Watermark, Wrong Sizing

Based on code analysis of `/src/components/billing/ReceiptPrintTemplate.tsx` and inline receipt HTML in `PaymentModal.tsx`:

1. **No Background Watermark Logo**:
   - Line 89 in ReceiptPrintTemplate: displays logo in header only (`<img src="/images/Gen-z-logo.jpg">`)
   - No CSS for background watermark image
   - Need: `background-image: url('/images/Gen-z-logo.png')` with `opacity: 0.05-0.1`, `background-position: center`, `background-repeat: no-repeat`

2. **Page Size Not Set for 80mm Thermal**:
   - Print styles missing `@page { size: 80mm auto; margin: 0; }` rule
   - Current styling uses `max-width: 300px` which is approximate
   - 80mm = ~302px, but content area should be 72mm (~272px) for margins

3. **Non-Monospace Font Causes Misalignment**:
   - Current: `font-family: 'Courier New', monospace` is correct
   - BUT: item-row flexbox layout may not align properly
   - Need explicit column widths or table layout for prices to align

4. **Receipt Generation in Two Places**:
   - PaymentModal.tsx line 51: inline HTML string for print window
   - ReceiptPrintTemplate.tsx: separate component
   - Need to consolidate or ensure both have same fixes


### Part 7: Order Placement Speed - Real Latency

Based on code analysis of `/src/app/api/orders/route.ts` POST endpoint:

1. **Sequential Database Operations in Transaction**:
   - Lines 174-224: creates order, updates table, decrements stock in sequence
   - Each `await tx.menuItem.update()` is sequential (inside for loop)
   - Could batch stock updates using `updateMany` or parallel promises

2. **Prisma Client Singleton Check Needed**:
   - `/src/lib/prisma.ts` should export singleton instance
   - Need to verify: `global.prisma` pattern to prevent connection pool exhaustion
   - Each request creating new PrismaClient = connection overhead

3. **Large Response Payload**:
   - Lines 192-201: includes full `table`, nested `items`, nested `menuItem` objects
   - KDS only needs: order ID, table number, item names, quantities
   - Could use `select` to limit fields returned

4. **No Performance Metrics**:
   - Need to add timing logs: `console.time('order-creation')`
   - Measure: DB query time, transaction time, total endpoint latency
   - Identify actual bottleneck before optimizing


### Part 8: Running Table / Table Transfer / KDS Urgent - Interconnected Bugs

Based on code analysis of `/src/app/api/orders/route.ts`, `/src/app/api/orders/[id]/transfer/route.ts`, and `/src/app/(pos)/kds/page.tsx`:

#### Symptom A: Running Table Logic Analysis

**File**: `/src/app/api/orders/route.ts` lines 132-172

**Current Logic**:
1. Checks if `table.status === 'OCCUPIED'` (line 132)
2. Finds active order: `prisma.order.findFirst({ where: { tableId, status: { notIn: ['COMPLETED', 'SERVED'] } } })`
3. If found: appends items using `tx.orderItem.createMany({ data: orderItemsData.map(item => ({ ...item, orderId: activeOrder.id })) })`
4. Updates order: `tx.order.update({ where: { id: activeOrder.id }, data: { totalAmount: { increment: totalAmount } } })`

**Hypothesis**: Logic LOOKS CORRECT for appending items. Potential issues:
- Query might not find order if `status` is wrong (e.g., already 'READY')
- Multiple orders for same table possible (should use `orderBy: { createdAt: 'desc' }` - it does!)
- If no activeOrder found, falls through to create NEW order (line 174) even though table OCCUPIED

**Root Cause (LIKELY)**: Lines 132-172 logic only executes if `table.status === 'OCCUPIED'`. BUT: What if table status not yet updated to OCCUPIED? Race condition.


#### Symptom B: Table Transfer Logic Analysis

**File**: `/src/app/api/orders/[id]/transfer/route.ts` lines 54-89

**Current Logic**:
1. Finds order by ID: `prisma.order.findFirst({ where: { id, table: { restaurantId } } })`
2. Updates order: `tx.order.update({ where: { id: order.id }, data: { tableId: newTableId } })`
3. Updates new table: `tx.table.update({ where: { id: newTableId }, data: { status: 'OCCUPIED' } })`
4. Updates old table to AVAILABLE if no other orders

**Hypothesis**: Logic LOOKS CORRECT for updating tableId. Potential issues:
- Query to find order only checks `table: { restaurantId }` - doesn't verify order belongs to old table
- After transfer, running table logic (Symptom A) searches for order by `tableId`
- If subsequent "add items to Table 4" searches `where: { tableId: newTableId }`, it SHOULD find transferred order

**Root Cause (LIKELY)**: NOT in transfer logic itself. Issue may be in how client refetches order data after transfer. Client might cache old tableId locally.


#### Symptom C: KDS Urgent Detection Logic Analysis

**File**: `/src/app/(pos)/kds/page.tsx` lines 213-257

**Current Logic**:
1. Polls `/api/orders?status=PENDING,PREPARING` every 3 seconds
2. Compares `order.items.length` with previous poll: `order.items.length > oldOrder.items.length`
3. If more items: triggers urgent sound (line 246)

**Hypothesis**: Logic LOOKS CORRECT for detecting item count increase. Potential issues:
- If running table creates SECOND order (Symptom A bug): old order has 2 items, new order has 3 items
  - KDS sees TWO separate orders in response, not one order with 5 items
  - Comparison fails because it's comparing different order IDs
- If table transfer doesn't preserve order continuity (Symptom B bug): transferred order gets new ID
  - Previous poll: Table 1, Order ABC, 2 items
  - Current poll: Table 4, Order XYZ, 2 items (transferred)
  - KDS doesn't recognize as same order, treats as NEW order (not urgent)

**Root Cause (CONFIRMED)**: KDS urgent detection is VICTIM of Symptom A and B bugs. If those are fixed, KDS will work reliably.

**Additional Issue**: Lines 229-240 check for `[URGENT ADDITION]` in specialInstructions. This is a WORKAROUND that shouldn't be needed if order data is correct.


## Correctness Properties

Property 1: Concurrent Session Data Integrity

_For any_ scenario where two devices with the same user credentials make concurrent order operations (within 5 seconds) on the same table or order, the fixed system SHALL either: (a) serialize operations to prevent race conditions, (b) detect conflicts and return error, or (c) implement optimistic locking with version checks, ensuring NO silent data loss occurs.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: API-Level Authorization Enforcement

_For any_ API endpoint that modifies prices, menu items, settings, or manages staff accounts, the fixed system SHALL check user role and return 403 Forbidden if role is STAFF, allowing only ADMIN role to access these operations.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7**

Property 3: Menu Edit Functionality

_For any_ existing menu item, ADMIN users SHALL be able to modify any property (name, price, priceHalf, category, dietType, hasHalfFullOption, stockQuantity) through UI edit form that calls PATCH endpoint, successfully updating the database record.

**Validates: Requirements 2.8, 2.9, 2.10, 2.11, 2.12, 2.13**

Property 4: Service Charge Toggle Behavior

_For any_ payment collection operation, staff SHALL see service charge toggle in PaymentModal that recalculates total in real-time when toggled, and stores serviceChargeApplied field in bill record alongside serviceChargeAmount.

**Validates: Requirements 2.14, 2.15, 2.16**


Property 5: UPI Payment Method Recording

_For any_ bill where customer pays via UPI, staff SHALL select UPI button in PaymentModal which stores paymentMethod: 'UPI' in bill record, flowing into revenue reporting with correct payment method label.

**Validates: Requirements 2.17, 2.18, 2.19**

Property 6: Revenue Report Payment Method Breakdown

_For any_ revenue report request, the API SHALL group bills by paymentMethod, calculate sum for each group (Cash, UPI, Card, Split), and return breakdown data that frontend displays in format "Cash: ₹X · UPI: ₹Y · Card: ₹Z · Total: ₹W".

**Validates: Requirements 2.20, 2.21, 2.22**

Property 7: Receipt Format Compliance

_For any_ printed receipt, the system SHALL include Gen-z-logo.png as 5-10% opacity background watermark, use @page CSS with size: 80mm auto and container width: 72mm, and apply monospace font for proper price alignment on thermal printer.

**Validates: Requirements 2.23, 2.24, 2.25, 2.26**

Property 8: Order Placement Performance

_For any_ "Send to Kitchen" operation, after identifying and fixing the actual bottleneck (DB operations, Prisma client, payload size, or client computation), the fixed system SHALL demonstrate measurably reduced latency with documented evidence of the specific optimization applied.

**Validates: Requirements 2.27, 2.28, 2.29, 2.30, 2.31**


Property 9: Running Table Item Aggregation

_For any_ occupied table with an existing active order (status PENDING, PREPARING, or READY), when new items are added, the fixed system SHALL find the existing Order record by tableId, append new OrderItem entities to that order (never creating a second Order for the same table), and return ALL items (old + new) together in the response.

**Validates: Requirements 2.32, 2.33**

Property 10: Table Transfer Data Preservation

_For any_ table transfer operation, the fixed system SHALL update the tableId field on the existing Order record, preserve ALL associated OrderItem entities, and ensure subsequent "add items" operations correctly identify the transferred order using the updated tableId lookup key.

**Validates: Requirements 2.34, 2.35, 2.36**

Property 11: KDS Urgent Detection Reliability

_For any_ KDS poll after items are added to a running order (following fixes to Properties 9 and 10), the system SHALL compare current order's item count with previous poll's item count for THE SAME order ID, reliably detect increases, and trigger urgent sound and visual indicator consistently.

**Validates: Requirements 2.37, 2.38, 2.39**

Property 12: End-to-End Running Table Flow Verification

_For any_ complete flow (Table 1 gets order with 2 items → Transfer to Table 4 → Add 3 more items to Table 4), the fixed system SHALL show resulting Order entity with exactly 5 OrderItem entities associated with Table 4, and KDS SHALL identify the 3 new items as "urgent" additions to running order.

**Validates: Requirements 2.40, 2.41**


Property 13: Preservation - Existing Authentication Flow

_For any_ user login operation via Google OAuth or email/password, the fixed system SHALL continue to authenticate successfully using NextAuth, maintain session state identically to current production behavior, with no changes to session storage or token handling.

**Validates: Requirements 3.1**

Property 14: Preservation - New Table Order Creation

_For any_ order creation on an empty/available table, the fixed system SHALL continue to create Order record, update table status to OCCUPIED, store OrderItems correctly, exactly as current production behavior (unchanged by Part 1 or Part 8 fixes).

**Validates: Requirements 3.2**

Property 15: Preservation - All Other Working Features

_For any_ operation not explicitly covered by bug conditions in Parts 1-8 (bill generation, menu display, table status, reports total calculation, receipt header/footer, order status workflow, database relationships, menu creation, protected routes, GST toggle, cash payment), the fixed system SHALL produce identical behavior to current production.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14**


## Fix Implementation

### Part 1: Data Corruption - Concurrent Session Isolation

#### Investigation Methodology (CRITICAL FIRST STEP)

Before implementing any fix, MUST perform these traces:

**Trace 1: Reproduce Data Loss in Local Environment**
1. Set up two browser windows/devices with same login credentials
2. Create order on Table 5 from Device A with items [Paneer Tikka x2]
3. Within 5 seconds, from Device B, add items [Naan x3] to Table 5
4. Check database: `SELECT * FROM "Order" WHERE "tableId" = '<Table5-ID>' ORDER BY "createdAt" DESC;`
5. Check order items: `SELECT * FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "tableId" = '<Table5-ID>');`
6. **Expected if Bug Exists**: Either (a) two Order records for Table 5, or (b) one Order with only 3 items, or (c) one Order with 5 items but client shows 3

**Trace 2: Add Logging to Order Creation API**
File: `/src/app/api/orders/route.ts`
Add logs at lines 132, 141, 147, 174:
```typescript
console.log('[ORDER-CREATE] Table status:', table?.status, 'TableId:', tableId);
console.log('[ORDER-CREATE] Active order found:', activeOrder?.id, 'Items:', activeOrder?.items?.length);
console.log('[ORDER-CREATE] Appending items to order:', activeOrder.id, 'New items:', orderItemsData.length);
console.log('[ORDER-CREATE] Creating new order for table:', tableId);
```

**Trace 3: Check Client-Side State Management**
File: Location TBD (likely `/src/app/(pos)/dashboard/page.tsx` or `/src/components/dashboard/dashboard.tsx`)
Search for: `fetch('/api/orders',` and state updates after order creation
Check: Does client merge server response with local state, or blindly replace?


#### Implementation Changes (After Root Cause Confirmed)

**Change 1: Add Optimistic Locking to Order Entity**

File: `prisma/schema.prisma`
```prisma
model Order {
  // ... existing fields ...
  version       Int           @default(0)  // Add version field for optimistic locking
  // ... rest of fields ...
}
```

File: `/src/app/api/orders/route.ts` (lines 147-158)
```typescript
// When appending items to active order:
const updatedOrder = await prisma.$transaction(async (tx) => {
  // Read current version
  const currentOrder = await tx.order.findUnique({
    where: { id: activeOrder.id },
    select: { version: true }
  });
  
  if (!currentOrder || currentOrder.version !== activeOrder.version) {
    throw new Error('CONFLICT: Order was modified by another session');
  }
  
  // Append items and increment version
  await tx.orderItem.createMany({ data: orderItemsData.map(item => ({ ...item, orderId: activeOrder.id })) });
  
  return tx.order.update({
    where: { id: activeOrder.id, version: activeOrder.version },  // WHERE clause includes version check
    data: {
      totalAmount: { increment: totalAmount },
      status: 'PENDING',
      version: { increment: 1 }  // Increment version on every update
    },
    include: { table: true, items: { include: { menuItem: true } } }
  });
});
```


**Change 2: Implement API-Level Role-Based Authorization Middleware**

File: `/src/lib/api-auth.ts` (add new function)
```typescript
/**
 * Check if user has required role for admin operations
 */
export async function checkAdminAuth(req?: any) {
  const auth = await checkAuth(req);
  if (auth.error) return auth;
  
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' }, 
        { status: 403 }
      ),
      session: null
    };
  }
  
  return auth;
}
```

File: `/src/app/api/menu/route.ts` POST handler (line 49)
```typescript
export async function POST(request: Request) {
  const auth = await checkAdminAuth(request);  // Change from checkAuth to checkAdminAuth
  if (auth.error) return auth.error;
  // ... rest of handler ...
}
```

Apply `checkAdminAuth` to these endpoints:
- `/src/app/api/menu/route.ts` POST (create menu item)
- `/src/app/api/menu/[id]/route.ts` PATCH (edit menu item - Part 2)
- `/src/app/api/menu/[id]/route.ts` DELETE (delete menu item)
- `/src/app/api/tables/[id]/route.ts` DELETE (delete table)
- `/src/app/api/reports/route.ts` GET (view financial reports - already has this)
- Future: `/src/app/api/settings/*` routes when created


**Change 3: Create Separate STAFF Account Credentials**

File: Manual database operation (via Prisma Studio or SQL)
```sql
-- Verify current admin account
SELECT id, email, role FROM "User" WHERE email = 'business.genzresturant@gmail.com';

-- Create staff account 1
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'staff1@genzrestaurant.com',
  '$2a$10$[bcrypt-hash-of-strong-password]',  -- Generate using bcrypt
  'Staff Device 1',
  'STAFF',
  (SELECT "restaurantId" FROM "User" WHERE email = 'business.genzresturant@gmail.com'),
  NOW()
);

-- Create staff account 2 (optional, for second device)
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'staff2@genzrestaurant.com',
  '$2a$10$[bcrypt-hash-of-strong-password]',
  'Staff Device 2',
  'STAFF',
  (SELECT "restaurantId" FROM "User" WHERE email = 'business.genzresturant@gmail.com'),
  NOW()
);
```

**Action for User**: Provide staff credentials to restaurant owner:
- Staff Device 1: staff1@genzrestaurant.com / [generated password]
- Staff Device 2: staff2@genzrestaurant.com / [generated password]
- Admin Account: business.genzresturant@gmail.com / [existing password]


### Part 2: Manage Menu - Missing Edit/Category Features

#### Changes Required

**Change 1: Add Menu Item Update API Endpoint**

File: `/src/app/api/menu/[id]/route.ts` (create if doesn't exist)
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/api-auth';
import { createMenuItemSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// PATCH - Update existing menu item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate with partial schema (allow updating subset of fields)
    const validation = createMenuItemSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const restaurantId = (auth.session.user as any).restaurantId;
    
    // Verify menu item belongs to user's restaurant
    const existing = await prisma.menuItem.findFirst({
      where: { id, restaurantId }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Update menu item
    const updated = await prisma.menuItem.update({
      where: { id },
      data: validation.data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}
```


**Change 2: Add Edit UI to ManageMenuModal Component**

File: `/src/components/modals/ManageMenuModal.tsx`

Add state for edit mode (after line 35):
```typescript
const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
const [editForm, setEditForm] = useState({
  name: '',
  category: '',
  price: '',
  dietType: 'VEG' as 'VEG' | 'NON_VEG',
  hasHalfFullOption: false,
  priceHalf: '',
});
```

Add handler for opening edit form:
```typescript
const handleEditClick = (item: MenuItem) => {
  setEditingItem(item);
  setEditForm({
    name: item.name,
    category: item.category,
    price: item.price.toString(),
    dietType: item.dietType,
    hasHalfFullOption: item.hasHalfFullOption || false,
    priceHalf: item.priceHalf ? item.priceHalf.toString() : '',
  });
  setShowAddForm(false);  // Close add form if open
};
```

Add handler for submitting edit:
```typescript
const handleUpdateItem = async () => {
  if (!editingItem || !editForm.name || !editForm.category || !editForm.price) return;

  try {
    const response = await fetch(`/api/menu/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        category: editForm.category,
        price: parseFloat(editForm.price),
        dietType: editForm.dietType,
        hasHalfFullOption: editForm.hasHalfFullOption,
        ...(editForm.hasHalfFullOption && editForm.priceHalf
          ? { priceHalf: parseFloat(editForm.priceHalf) }
          : { priceHalf: null }),
      }),
    });

    if (response.ok) {
      setEditingItem(null);
      fetchMenuItems();
    }
  } catch (error) {
    console.error('Failed to update menu item:', error);
  }
};
```


Add Edit button to menu item row (after "Mark Unavailable" button, line 285):
```typescript
<button
  onClick={() => handleEditClick(item)}
  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
  title="Edit menu item"
>
  <Edit2 className="w-4 h-4" />
</button>
```

Add Edit form section (insert after Add form section, around line 240):
```typescript
{/* Edit Form */}
{editingItem && (
  <div className="bg-blue-500/10 rounded-xl p-4 mb-6 animate-fade-in border border-blue-500/30">
    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
      <Edit2 className="w-4 h-4 text-blue-500" />
      Edit Menu Item
    </h3>
    {/* Same form structure as Add form, but using editForm state */}
    <div className="grid grid-cols-2 gap-3 mb-3">
      <input
        type="text"
        placeholder="Item Name"
        value={editForm.name}
        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
        className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {/* ... rest of form fields using editForm state ... */}
    </div>
    <div className="flex gap-2">
      <button
        onClick={handleUpdateItem}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
      >
        Update Item
      </button>
      <button
        onClick={() => setEditingItem(null)}
        className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```


**Change 3: Implement Category Dropdown with Existing Categories**

File: `/src/components/modals/ManageMenuModal.tsx`

Extract unique categories (already done at line 267):
```typescript
const categories = ['ALL', ...new Set(menuItems.map((item) => item.category))];
```

Replace plain text input for category with select/datalist combo:
```typescript
{/* In Add form and Edit form, replace category input with: */}
<div className="relative">
  <input
    type="text"
    placeholder="Category"
    value={newItem.category}  // or editForm.category
    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
    list="categories-list"
    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
  />
  <datalist id="categories-list">
    {categories.filter(c => c !== 'ALL').map(cat => (
      <option key={cat} value={cat} />
    ))}
  </datalist>
</div>
```

**Alternative (more UX-friendly)**: Use Combobox component from Radix UI or custom dropdown that shows existing categories as suggestions while allowing free text entry.


### Part 3: Service Charge Toggle - Correct Location and Behavior

#### Changes Required

**Change 1: Add Service Charge Fields to Database Schema**

File: `prisma/schema.prisma`
```prisma
model Bill {
  // ... existing fields ...
  gstApplied        Boolean            @default(true)
  serviceChargeApplied Boolean         @default(false)  // NEW FIELD
  serviceChargeAmount  Float           @default(0)      // NEW FIELD
  // ... rest of fields ...
}
```

Run migration:
```bash
npx prisma migrate dev --name add-service-charge-fields
```

**Change 2: Add Service Charge State and Toggle to PaymentModal**

File: `/src/components/billing/PaymentModal.tsx`

Add state (after `gstApplied` state, around line 44):
```typescript
const [serviceChargeApplied, setServiceChargeApplied] = useState(false);
const SERVICE_CHARGE_PERCENT = 10;  // Standard 10% service charge
```

Update `calculateFinalTotal` helper (line 18):
```typescript
const calculateFinalTotal = (
  bill: any, 
  discountPct: number = 0, 
  pointsAmt: number = 0, 
  includeGst: boolean = true,
  includeServiceCharge: boolean = false  // NEW PARAMETER
) => {
  const serviceChargeAmt = includeServiceCharge ? (bill.subtotal * 0.10) : 0;
  const baseAmount = bill.subtotal + serviceChargeAmt + (includeGst ? (bill.tax || 0) : 0);
  const discountAmt = (bill.subtotal * discountPct) / 100;
  return Math.max(0, baseAmount - discountAmt - pointsAmt);
};
```


Add Service Charge toggle UI (insert after GST toggle, around line 517):
```typescript
{/* Service Charge Toggle */}
<div>
  <label className="flex items-center justify-between cursor-pointer p-3 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors">
    <span className="text-sm font-semibold text-foreground">Apply Service Charge (10%)</span>
    <div className="relative">
      <input
        type="checkbox"
        checked={serviceChargeApplied}
        onChange={(e) => setServiceChargeApplied(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </div>
  </label>
  <p className="text-xs text-muted-foreground mt-1">
    {serviceChargeApplied 
      ? `Service charge (₹${(bill.subtotal * 0.10).toFixed(2)}) will be added to this bill` 
      : 'Bill will be generated without service charge'
    }
  </p>
</div>
```

Update payment summary display (around line 384):
```typescript
{serviceChargeApplied && (
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm text-muted-foreground">Service Charge (10%)</span>
    <span className="font-bold text-foreground">₹{(bill.subtotal * 0.10).toFixed(2)}</span>
  </div>
)}
```

Update `handlePayAndPrint` to include service charge data (around line 277):
```typescript
body: JSON.stringify({
  // ... existing fields ...
  gstApplied,
  serviceChargeApplied,
  serviceChargeAmount: serviceChargeApplied ? bill.subtotal * 0.10 : 0,
  // ... rest of fields ...
}),
```


Update all `calculateFinalTotal()` calls to include `serviceChargeApplied` parameter:
```typescript
// Example (line 388):
₹{calculateFinalTotal(bill, discountPct, pointsAmt, gstApplied, serviceChargeApplied).toFixed(2)}
```

**Change 3: Update Receipt Templates to Show Service Charge**

File: `/src/components/billing/PaymentModal.tsx` (receipt HTML, around line 140)
```typescript
${bill.serviceChargeApplied ? `
<div class="total-row">
  <span>Service Charge (10%):</span>
  <span>₹${(bill.serviceChargeAmount || 0).toFixed(2)}</span>
</div>
` : ''}
```

File: `/src/components/billing/ReceiptPrintTemplate.tsx` (similar change around line 160)


### Part 4: UPI Payment Method - Option Available

#### Changes Required

**Change 1: Add UPI Button to PaymentModal**

File: `/src/components/billing/PaymentModal.tsx`

Update payment method selection grid (line 560-591) from 3 columns to 4 columns:
```typescript
<div className="grid grid-cols-4 gap-3">  {/* Changed from grid-cols-3 */}
  {/* Cash Button - existing */}
  <button
    onClick={() => {
      setPaymentConfirmed('CASH');
      setIsSplitPayment(false);
      setCashAmount('');
      setOnlineAmount('');
    }}
    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
      paymentConfirmed === 'CASH' && !isSplitPayment 
        ? 'border-green-500/50 bg-green-500/10 text-green-500' 
        : 'border-border hover:border-green-500/30 hover:bg-muted text-muted-foreground'
    }`}
  >
    <span className="text-2xl">💵</span>
    <span className="text-xs font-bold">Cash</span>
  </button>
  
  {/* UPI Button - NEW */}
  <button
    onClick={() => {
      setPaymentConfirmed('UPI');
      setIsSplitPayment(false);
      setCashAmount('');
      setOnlineAmount('');
    }}
    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
      paymentConfirmed === 'UPI' && !isSplitPayment 
        ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' 
        : 'border-border hover:border-blue-500/30 hover:bg-muted text-muted-foreground'
    }`}
  >
    <span className="text-2xl">📱</span>
    <span className="text-xs font-bold">UPI</span>
  </button>
  
  {/* Card Button - existing */}
  {/* Split Button - existing */}
</div>
```


**Change 2: Update Bill API to Accept UPI Payment Method**

File: `/src/app/api/bills/[id]/route.ts` (PATCH handler)

Ensure paymentMethod accepts 'UPI' value (should already work since field is `String?`):
```typescript
// Validation (add if doesn't exist):
const validPaymentMethods = ['CASH', 'UPI', 'CARD', 'SPLIT'];
if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
  return NextResponse.json(
    { error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` },
    { status: 400 }
  );
}
```

**Change 3: Update Receipt Templates to Show UPI Label**

File: `/src/components/billing/PaymentModal.tsx` (receipt HTML, around line 172)
```typescript
${bill.status === 'PAID' ? `
<div class="payment-status">
  ✓ PAID - ${bill.paymentMethod || 'CASH'}
</div>
` : ''}
```

No change needed - already uses `bill.paymentMethod` dynamically. Will display "UPI" when that's the value.


### Part 5: Revenue Report - Payment Method Breakdown Displayed

#### Changes Required

**Change 1: Update Reports API to Group by Payment Method**

File: `/src/app/api/reports/route.ts`

Replace revenue calculation (lines 64-67) with grouped aggregation:
```typescript
// Calculate payment method breakdown
const paymentMethodBreakdown = {
  cash: 0,
  upi: 0,
  card: 0,
  split_cash: 0,
  split_online: 0,
  total: 0
};

bills.forEach((bill: any) => {
  const method = bill.paymentMethod?.toUpperCase() || 'CASH';
  
  if (method === 'CASH') {
    paymentMethodBreakdown.cash += bill.total;
  } else if (method === 'UPI') {
    paymentMethodBreakdown.upi += bill.total;
  } else if (method === 'CARD') {
    paymentMethodBreakdown.card += bill.total;
  } else if (method === 'SPLIT') {
    // For split payments, use cashAmount and onlineAmount fields
    paymentMethodBreakdown.split_cash += bill.cashAmount || 0;
    paymentMethodBreakdown.split_online += bill.onlineAmount || 0;
  }
  
  paymentMethodBreakdown.total += bill.total;
});

// Combine split amounts with main categories for cleaner display
const finalBreakdown = {
  cash: paymentMethodBreakdown.cash + paymentMethodBreakdown.split_cash,
  upi: paymentMethodBreakdown.upi,  // Split online likely includes UPI
  card: paymentMethodBreakdown.card,
  online: paymentMethodBreakdown.split_online,  // Generic "online" category
  total: paymentMethodBreakdown.total
};

return NextResponse.json({
  dailySalesTotal: finalBreakdown.total,
  paymentBreakdown: finalBreakdown,  // NEW FIELD
  ordersCount,
  topItems,
  dateRange: {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  }
}, { headers: { /* cache headers */ } });
```


**Change 2: Update TodayRevenueModal to Display Breakdown**

File: `/src/components/dashboard/TodayRevenueModal.tsx`

Assuming current component displays single total (need to verify structure), add breakdown display:
```typescript
// In component JSX (after total revenue display):
{report.paymentBreakdown && (
  <div className="mt-6 space-y-3 border-t border-border pt-4">
    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
      Payment Method Breakdown
    </h4>
    
    <div className="space-y-2">
      <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">💵</span>
          <span className="font-semibold text-foreground">Cash</span>
        </div>
        <span className="font-bold text-lg text-green-600">
          ₹{report.paymentBreakdown.cash.toFixed(2)}
        </span>
      </div>
      
      <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <span className="font-semibold text-foreground">UPI</span>
        </div>
        <span className="font-bold text-lg text-blue-600">
          ₹{report.paymentBreakdown.upi.toFixed(2)}
        </span>
      </div>
      
      <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">💳</span>
          <span className="font-semibold text-foreground">Card / Online</span>
        </div>
        <span className="font-bold text-lg text-purple-600">
          ₹{(report.paymentBreakdown.card + report.paymentBreakdown.online).toFixed(2)}
        </span>
      </div>
    </div>
    
    {/* One-line summary format as requested */}
    <p className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
      Cash: ₹{report.paymentBreakdown.cash.toFixed(0)} · 
      UPI: ₹{report.paymentBreakdown.upi.toFixed(0)} · 
      Card: ₹{(report.paymentBreakdown.card + report.paymentBreakdown.online).toFixed(0)} · 
      Total: ₹{report.paymentBreakdown.total.toFixed(0)}
    </p>
  </div>
)}
```


### Part 6: Receipt Format - Watermark and Proper Sizing

#### Changes Required

**Change 1: Add Background Watermark to Receipt Print Styles**

File: `/src/components/billing/PaymentModal.tsx` (inline receipt HTML, around line 62)

Update body styles:
```typescript
body {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #000;
  background: #fff;
  padding: 10px;
  max-width: 300px;
  margin: 0 auto;
  position: relative;  /* NEW */
}

/* NEW - Watermark styles */
body::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background-image: url('/images/Gen-z-logo.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.05;
  z-index: -1;
  pointer-events: none;
}
```

**Change 2: Set Proper 80mm Thermal Paper Size**

Add @page rule at top of styles:
```typescript
@page {
  size: 80mm auto;
  margin: 0;
}

/* Update body max-width to match 72mm content area */
body {
  /* ... existing styles ... */
  max-width: 272px;  /* Changed from 300px - 72mm ≈ 272px */
  width: 100%;
}
```


**Change 3: Ensure Monospace Alignment for Prices**

Update item-row styles for guaranteed alignment:
```typescript
.item-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
}

.item-name {
  flex: 1;
  font-weight: 600;
  max-width: 180px;  /* Prevent long names from pushing price */
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  font-weight: bold;
  min-width: 70px;
  text-align: right;
  font-family: 'Courier New', monospace;  /* Ensure monospace */
  white-space: nowrap;
}
```

**Change 4: Apply Same Fixes to ReceiptPrintTemplate Component**

File: `/src/components/billing/ReceiptPrintTemplate.tsx`

Apply identical changes to print styles section (lines 40-130):
- Add body::before watermark
- Update @page { size: 80mm auto; margin: 0; }
- Change body max-width to 272px
- Update item-price styles for alignment

**Note**: Consider consolidating both receipt generation locations into single source of truth to prevent drift.


### Part 7: Order Placement Speed - Actual Bottleneck Fixed

#### Investigation Methodology (CRITICAL FIRST STEP)

**Step 1: Add Performance Timing Logs**

File: `/src/app/api/orders/route.ts` (POST handler)

Add timing at strategic points:
```typescript
export async function POST(request: Request) {
  console.time('[ORDER-PERF] Total endpoint latency');
  console.time('[ORDER-PERF] Request body parsing');
  
  // ... auth check ...
  
  console.time('[ORDER-PERF] Body parsing');
  const body = await request.json();
  console.timeEnd('[ORDER-PERF] Body parsing');
  
  // ... validation ...
  
  console.time('[ORDER-PERF] Table lookup');
  let table = null;
  if (tableId) {
    table = await prisma.table.findFirst({ /* ... */ });
  }
  console.timeEnd('[ORDER-PERF] Table lookup');
  
  console.time('[ORDER-PERF] Menu items fetch');
  const menuItems = await prisma.menuItem.findMany({ /* ... */ });
  console.timeEnd('[ORDER-PERF] Menu items fetch');
  
  console.time('[ORDER-PERF] Price calculation');
  // ... totalAmount calculation loop ...
  console.timeEnd('[ORDER-PERF] Price calculation');
  
  console.time('[ORDER-PERF] Database transaction');
  const order = await prisma.$transaction(async (tx) => {
    // ... transaction operations ...
  });
  console.timeEnd('[ORDER-PERF] Database transaction');
  
  console.timeEnd('[ORDER-PERF] Total endpoint latency');
  
  return NextResponse.json(order, { status: 201 });
}
```

**Step 2: Measure Client-Side Timing**

File: Client component that calls order creation (likely `/src/app/(pos)/dashboard/page.tsx` or similar)

Add timing around fetch call:
```typescript
console.time('[CLIENT-PERF] Order creation request');
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
console.timeEnd('[CLIENT-PERF] Order creation request');
```


**Step 3: Run Test Orders and Analyze Logs**

1. Create 3-5 test orders with varying item counts (2 items, 5 items, 10 items)
2. Check server logs for timing breakdowns
3. Identify which operation takes >500ms
4. Only proceed with optimization AFTER identifying bottleneck

#### Implementation Changes (Apply ONLY After Confirming Bottleneck)

**Optimization 1: Batch Stock Updates (If Transaction Time is Bottleneck)**

File: `/src/app/api/orders/route.ts` (lines 210-224)

Replace sequential updates with batched operations:
```typescript
// BEFORE (sequential):
for (const item of orderItemsData) {
  const menuItem = menuItemMap.get(item.menuItemId);
  if (menuItem && menuItem.stockQuantity !== null) {
    const newStock = menuItem.stockQuantity - item.quantity;
    await tx.menuItem.update({
      where: { id: item.menuItemId },
      data: { stockQuantity: Math.max(0, newStock), available: newStock > 0 }
    });
  }
}

// AFTER (batched with Promise.all):
const stockUpdates = orderItemsData
  .filter(item => {
    const menuItem = menuItemMap.get(item.menuItemId);
    return menuItem && menuItem.stockQuantity !== null;
  })
  .map(item => {
    const menuItem = menuItemMap.get(item.menuItemId);
    const newStock = menuItem!.stockQuantity! - item.quantity;
    return tx.menuItem.update({
      where: { id: item.menuItemId },
      data: { 
        stockQuantity: Math.max(0, newStock), 
        available: newStock > 0 ? menuItem!.available : false 
      }
    });
  });

await Promise.all(stockUpdates);
```


**Optimization 2: Verify Prisma Client Singleton (If Connection Overhead is Bottleneck)**

File: `/src/lib/prisma.ts`

Ensure singleton pattern is implemented:
```typescript
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Optimization 3: Reduce Response Payload Size (If Network Transfer is Bottleneck)**

File: `/src/app/api/orders/route.ts` (lines 192-201)

Use select to limit returned fields:
```typescript
const newOrder = await tx.order.create({
  data: { /* ... */ },
  select: {
    id: true,
    tableId: true,
    status: true,
    totalAmount: true,
    createdAt: true,
    table: {
      select: { id: true, number: true, status: true }
    },
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
        portionType: true,
        menuItem: {
          select: { id: true, name: true, category: true }  // Omit imageUrl, createdAt, etc.
        }
      }
    }
  }
});
```

**Note**: Do NOT apply all optimizations blindly. ONLY apply the specific optimization that addresses the identified bottleneck. Document which bottleneck was found and which optimization was applied.


### Part 8: Running Table / Table Transfer / KDS Urgent - Root Causes Fixed

#### Investigation Methodology (CRITICAL FIRST STEP)

**Test Scenario: Complete Flow Reproduction**

1. **Setup**: Fresh database state, Table 1 is AVAILABLE
2. **Action 1**: Create order for Table 1 with 2 items (Paneer Tikka, Naan)
   - Verify in DB: `SELECT * FROM "Order" WHERE "tableId" = '<Table1-ID>';` → Should return 1 order
   - Verify items: `SELECT COUNT(*) FROM "OrderItem" WHERE "orderId" = '<Order-ID>';` → Should return 2
3. **Action 2**: Transfer Table 1 order to Table 4
   - Verify in DB: Order's tableId should now be Table4-ID
   - Verify items: Same 2 OrderItem entities should still exist with same orderId
4. **Action 3**: Add 3 more items to Table 4 (Dal Makhani, Roti x2)
   - **CRITICAL CHECK**: Does API find existing order by tableId='<Table4-ID>'?
   - Verify in DB: Should be SAME order ID with 5 total items (not a second order)
5. **Action 4**: Check KDS display
   - Should show Table 4 with 5 items
   - Should trigger urgent sound/indicator for 3 new items

**Expected Bug Locations** (based on hypothesis analysis):
- If Step 3 creates SECOND order → Bug in lines 132-141 of orders/route.ts
- If Step 4 shows split data → Bug in how client fetches/displays orders
- If Step 5 doesn't trigger urgent → Bug is consequence of Step 3/4, not KDS itself


#### Implementation Changes (Apply After Confirming Bug Location)

**Fix 1: Strengthen Running Table Order Lookup Logic**

File: `/src/app/api/orders/route.ts` (lines 132-141)

**Current logic**: Only checks running table if `table.status === 'OCCUPIED'`

**Problem**: Race condition - if table status not yet committed to DB when second request arrives, condition fails

**Solution**: ALWAYS check for existing active order by tableId, regardless of table status:

```typescript
// REMOVE the `if (table && table.status === 'OCCUPIED')` condition
// ALWAYS check for active order when tableId exists

if (tableId) {
  // Find any active order for this table, regardless of table status
  const activeOrder = await prisma.order.findFirst({
    where: {
      tableId,
      status: { 
        notIn: ['COMPLETED']  // Changed from ['COMPLETED', 'SERVED'] - keep SERVED orders editable
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true  // Include existing items for version check
    }
  });

  if (activeOrder) {
    console.log('[ORDER-CREATE] Found active order for table:', tableId, 'OrderID:', activeOrder.id);
    
    // Append items to existing order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({ 
          ...item, 
          orderId: activeOrder.id
        }))
      });

      // Stock updates (use batched Promise.all from Part 7 if applicable)
      // ... stock update logic ...

      return tx.order.update({
        where: { id: activeOrder.id },
        data: {
          totalAmount: { increment: totalAmount },
          status: 'PENDING',  // Reset to PENDING for kitchen notification
          version: { increment: 1 }  // Increment version (Part 1 fix)
        },
        include: {
          table: true,
          items: {
            include: { menuItem: true }
          }
        }
      });
    });

    return NextResponse.json(updatedOrder, { status: 201 });
  }
}

// If no active order found, create new order (existing logic continues)
```


**Fix 2: Verify Table Transfer Preserves Order Continuity**

File: `/src/app/api/orders/[id]/transfer/route.ts`

**Current logic**: Updates order.tableId - LOOKS CORRECT

**Potential issue**: Check if client-side caching causes stale tableId

**Add logging for debugging**:
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // ... existing auth check ...
  
  console.log('[TABLE-TRANSFER] Transferring order:', id, 'from table:', oldTableId, 'to table:', newTableId);
  
  await prisma.$transaction(async (tx) => {
    // Update order to new table
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { 
        tableId: newTableId,
        version: { increment: 1 }  // Increment version (Part 1 fix) - forces client refetch
      }
    });
    
    console.log('[TABLE-TRANSFER] Order updated, new tableId:', updated.tableId);
    
    // ... rest of transaction (update table statuses) ...
  });
  
  return NextResponse.json({ 
    success: true, 
    message: 'Table transferred successfully',
    orderId: order.id,  // Return orderId to help client refetch
    newTableId: newTableId
  });
}
```

**No logic change needed** - transfer already updates tableId correctly. Issue is likely in client-side state management or subsequent order lookup.


**Fix 3: KDS Urgent Detection - No Logic Change Needed**

File: `/src/app/(pos)/kds/page.tsx` (lines 213-257)

**Current logic**: Compares `order.items.length > oldOrder.items.length` - CORRECT

**Root cause**: KDS logic is NOT the bug. It's a VICTIM of bugs in Part 8A and 8B.

**After fixing Part 8A and 8B**:
- Running table will correctly append items to same Order (not create second order)
- Table transfer will correctly preserve Order with updated tableId
- KDS will receive complete Order data with correct item count
- Item count comparison will work reliably

**Optional Enhancement - Remove Workaround**:

Lines 229-240 check for `[URGENT ADDITION]` tag in specialInstructions - this is a WORKAROUND that shouldn't be needed

After confirming fixes work:
```typescript
// REMOVE this block (lines 229-240):
const hasUrgentInstruction = order.items.some((item: any) => 
  item.specialInstructions && item.specialInstructions.includes('[URGENT ADDITION]')
);

if (!oldOrder) {
  if (hasUrgentInstruction) {
    // ... urgent handling ...
  } else {
    // ... new order handling ...
  }
}

// SIMPLIFY to just item count comparison:
if (!oldOrder) {
  hasNew = true;
  newOrderIds.push(order.id);
} else if (order.items.length > oldOrder.items.length) {
  hasUrgent = true;
  urgentOrderIds.push(order.id);
}
```

**Keep enhanced logging for verification**:
```typescript
console.log(`[KDS] Comparing orders - Previous: ${prev.length}, Current: ${finalOrders.length}`);
finalOrders.forEach((order: any) => {
  const oldOrder = prev.find((o: any) => o.id === order.id);
  if (oldOrder && order.items.length > oldOrder.items.length) {
    console.log(`[KDS] URGENT: Order ${order.id} items increased from ${oldOrder.items.length} to ${order.items.length}`);
  }
});
```


## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach:

1. **Exploratory Phase**: Reproduce each bug in local/staging environment with detailed logging
2. **Fix Verification Phase**: Apply fix, re-run reproduction steps, verify resolution
3. **Regression Prevention Phase**: Run comprehensive test suite covering all preserved behaviors

This is a LIVE production system with real customer data. All testing MUST be performed in local/staging environment before production deployment.

### Part 1: Concurrent Session Isolation Testing

#### Exploratory Bug Reproduction

**Goal**: Confirm data loss mechanism BEFORE implementing fix

**Test Plan**:
1. Set up two browser sessions (Incognito + Regular, or two devices)
2. Login with same credentials on both sessions
3. Execute concurrent operations:
   - Session A: Add items [X, Y] to Table 5 at T=0
   - Session B: Add items [A, B, C] to Table 5 at T=2 seconds
4. Check database directly: `SELECT * FROM "Order" JOIN "OrderItem" ON "Order".id = "OrderItem"."orderId" WHERE "tableId" = '<Table5-ID>';`
5. Check both client displays

**Expected Counterexamples**:
- Database has all 5 items BUT one client shows only 3 items → Client state overwrite bug
- Database has only 3 items → API race condition bug (no optimistic locking)
- Database has TWO Order records for Table 5 → Running table logic bug


#### Fix Checking

**Goal**: Verify optimistic locking and API authorization prevent data loss and unauthorized access

**Test Cases**:
1. **Optimistic Locking Test**: Reproduce concurrent scenario with version field implemented
   - Expected: Second request returns 409 Conflict OR both succeed with all 5 items present
2. **STAFF Authorization Test**: Login as STAFF account, attempt to access `/api/menu` POST
   - Expected: 403 Forbidden response
3. **ADMIN Authorization Test**: Login as ADMIN account, access `/api/menu` POST
   - Expected: 200 OK, menu item created
4. **Separate Sessions Test**: STAFF on Device A, STAFF on Device B, concurrent orders on different tables
   - Expected: Both orders succeed independently, no data loss

#### Preservation Checking

**Goal**: Verify single-session order creation still works identically

**Test Cases**:
1. **Single Session New Table Order**: Login, create order for empty Table 3 with 4 items
   - Verify: Order created, table status = OCCUPIED, all 4 items saved
2. **Authentication Flow**: Login via Google OAuth and email/password
   - Verify: Session created, redirects work, protected routes accessible
3. **Existing Features**: Test menu display, bill generation, reports, table status display
   - Verify: All work identically to current production behavior


### Part 2-7: Feature Addition Testing

For Parts 2-7, testing follows standard feature verification:

#### Part 2: Menu Edit
- Create menu item "Test Dish" → Edit name to "Test Dish Updated" → Verify DB update
- Edit price from ₹100 to ₹150 → Verify new orders use ₹150
- Change category using dropdown → Verify category updated

#### Part 3: Service Charge Toggle
- Generate bill with service charge ON → Verify 10% added to subtotal → Verify bill record has `serviceChargeApplied: true`
- Generate bill with service charge OFF → Verify no charge added → Verify bill record has `serviceChargeApplied: false`
- Toggle during payment collection → Verify total recalculates in real-time

#### Part 4: UPI Payment
- Select UPI payment method → Complete payment → Verify bill record has `paymentMethod: 'UPI'`
- Print receipt → Verify shows "PAID - UPI"

#### Part 5: Revenue Report Breakdown
- Create 3 bills: 1 Cash (₹500), 1 UPI (₹300), 1 Card (₹200)
- View revenue report → Verify shows "Cash: ₹500 · UPI: ₹300 · Card: ₹200 · Total: ₹1000"

#### Part 6: Receipt Format
- Generate receipt → Print to 80mm thermal printer → Verify:
  - Background watermark visible (5-10% opacity)
  - No horizontal overflow/cutoff
  - Prices align properly in columns
  - Paper size matches thermal roll

#### Part 7: Order Placement Speed
- Add timing logs → Create order with 5 items → Check logs
- Identify bottleneck (e.g., "Database transaction: 1200ms")
- Apply specific optimization → Re-test → Verify latency reduced (e.g., "Database transaction: 400ms")
- Document: "Bottleneck was sequential stock updates. Fixed by batching with Promise.all. Latency reduced from 1200ms to 400ms."


### Part 8: Running Table / Table Transfer / KDS Urgent Testing

#### Exploratory Bug Reproduction

**Goal**: Trace exact failure point in complete flow BEFORE applying fixes

**Complete Flow Test**:
1. **Setup**: Clear database, all tables AVAILABLE
2. **Step 1**: Create order for Table 1 with 2 items (Paneer Tikka, Naan)
   - **Check DB**: `SELECT id, "tableId", status FROM "Order" WHERE "tableId" = '<Table1-ID>';`
   - **Expected**: 1 row returned, status = PENDING
   - **Check Items**: `SELECT COUNT(*) FROM "OrderItem" WHERE "orderId" = '<Order-ID>';`
   - **Expected**: 2 rows
3. **Step 2**: Transfer Table 1 order to Table 4
   - **Check DB**: `SELECT "tableId" FROM "Order" WHERE id = '<Order-ID>';`
   - **Expected**: tableId = '<Table4-ID>'
   - **Check Items**: `SELECT COUNT(*) FROM "OrderItem" WHERE "orderId" = '<Order-ID>';`
   - **Expected**: Still 2 rows (same orderId)
4. **Step 3**: Add 3 more items to Table 4 (Dal Makhani, Roti x2)
   - **Check API Logs**: Did POST /api/orders find activeOrder by tableId='<Table4-ID>'?
   - **Check DB**: `SELECT COUNT(*) FROM "Order" WHERE "tableId" = '<Table4-ID>';`
   - **Expected**: 1 order (CRITICAL - if 2 orders, bug confirmed)
   - **Check Items**: `SELECT COUNT(*) FROM "OrderItem" WHERE "orderId" = '<Order-ID>';`
   - **Expected**: 5 rows total
5. **Step 4**: Check KDS display
   - **Check API Response**: GET /api/orders?status=PENDING,PREPARING
   - **Expected**: 1 order with 5 items
   - **Actual (if bug exists)**: 2 orders (one with 2 items, one with 3 items) OR 1 order with 3 items
6. **Step 5**: Trigger KDS urgent detection
   - **Check**: Did urgent sound play? Did visual indicator appear?
   - **Expected (if bug exists)**: No sound/indicator OR intermittent behavior


#### Fix Checking

**Goal**: Verify complete flow works end-to-end after applying Fix 1 (running table lookup logic)

**Test Case: Complete Flow Verification**

Re-run Steps 1-5 from Exploratory phase WITH fixes applied:

**Expected Behavior After Fix**:
- Step 1: 1 Order created with 2 items ✓
- Step 2: Same Order, tableId updated to Table4-ID, 2 items preserved ✓
- Step 3: POST /api/orders log shows "Found active order for table: Table4-ID"
  - No second Order created
  - 3 new OrderItem entities added to existing Order
  - Database: 1 Order with 5 OrderItem entities ✓
- Step 4: GET /api/orders returns 1 order with 5 items
  - KDS displays Table 4 with all 5 items together ✓
- Step 5: KDS detects item count increase (2 → 5)
  - Urgent sound plays reliably ✓
  - Visual indicator shows "🔥 URGENT" ✓

**Additional Test Cases**:
1. **Running Table Without Transfer**: Table 2 gets 3 items → Add 2 more items → Verify 5 items total in same order
2. **Multiple Transfers**: Table 5 → Table 7 → Table 9 → Add items to Table 9 → Verify all items together
3. **Edge Case - COMPLETED Order**: Complete order on Table 3 → Try to add items to Table 3 → Should create NEW order (not append to completed one)


#### Preservation Checking

**Goal**: Verify existing order workflows not affected by Part 8 fixes

**Test Cases**:
1. **New Table Order**: Create order for empty Table 6 with 4 items
   - Verify: Order created normally, table marked OCCUPIED, all items saved
2. **Order Status Workflow**: Create order → Update status PENDING → PREPARING → READY → SERVED
   - Verify: Status updates work identically to current production
3. **Bill Generation**: Complete order → Generate bill → Verify calculations correct
4. **Table Status Display**: Check tables list → Verify AVAILABLE/OCCUPIED statuses correct
5. **Order Deletion**: Cancel order before completion → Verify table returns to AVAILABLE

### Regression Testing Suite

**Critical User Flows** (test ALL after implementing all 8 parts):

1. **Full Order Flow**: Login → Create order (3 items) → Send to kitchen → View KDS → Mark preparing → Generate bill → Collect payment (Cash) → Print receipt
2. **Running Table Flow**: Create order (2 items) on Table 1 → Add 3 more items → Verify 5 items total → Complete order
3. **Table Transfer Flow**: Create order on Table 2 → Transfer to Table 5 → Add items to Table 5 → Complete order
4. **Payment Methods Flow**: Create 3 orders → Pay one with Cash, one with UPI, one with Card → View revenue report → Verify breakdown
5. **Admin Operations**: Login as ADMIN → Edit menu item price → Add new menu item → Delete menu item → View reports
6. **Staff Operations**: Login as STAFF → Create order → Send to kitchen → Cannot access menu edit → Cannot view reports

### Production Deployment Checklist

Before deploying to production:
- [ ] All 8 parts tested individually in staging
- [ ] Regression test suite passed (all 6 critical flows)
- [ ] Database migrations run successfully in staging
- [ ] Performance timing logs show no degradation
- [ ] STAFF accounts created and credentials documented
- [ ] ADMIN confirms service charge percentage (10%) is correct
- [ ] Receipt watermark tested on actual 80mm thermal printer
- [ ] Backup of production database taken
- [ ] Rollback plan documented

