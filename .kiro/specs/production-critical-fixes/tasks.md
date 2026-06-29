# Implementation Plan

## Part 1: Data Corruption - Concurrent Session Isolation (HIGHEST PRIORITY)

- [x] 1.1 Write bug condition exploration test - Concurrent Session Data Loss
  - **Property 1: Bug Condition** - Concurrent Session Data Loss
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate concurrent data loss exists
  - **Scoped PBT Approach**: Test two devices with same credentials making concurrent order operations on same table within 5 seconds
  - Test implementation: Simulate two concurrent POST requests to `/api/orders` with same tableId, different items, timestamps within 5000ms
  - The test assertions should verify all items from both requests persist (no silent data loss)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: which items disappeared, which device's data overwrote the other
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 Investigate concurrent session bug root cause
  - Run Trace 1 from design: Reproduce data loss with two browser windows on local environment
  - Run Trace 2: Check database after concurrent operations - verify if data truly lost at DB level or client state issue
  - Run Trace 3: Examine `/src/app/api/orders/route.ts` lines 132-172 running table logic - check for race conditions
  - Run Trace 4: Inspect `/src/lib/api-auth.ts` - verify if role-based authorization exists
  - Document findings: Is it client-side state overwrite, API race condition, or optimistic locking issue?
  - Identify exact code location causing the bug
  - _Requirements: 2.1_

- [x] 1.3 Write preservation property tests - Non-Concurrent Operations
  - **Property 2: Preservation** - Non-Concurrent Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Single device creates order → Works correctly on unfixed code
  - Observe: Sequential order operations (>5 sec apart) → Works correctly on unfixed code
  - Write property-based test: for all non-concurrent operations (>5000ms apart), all data persists correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.1, 3.2_

- [ ] 1.4 Implement concurrent session isolation fix
  
  - [x] 1.4.1 Add optimistic locking to Order entity
    - Update Prisma schema: add `version Int @default(0)` field to Order model
    - Run `npx prisma migrate dev --name add-order-version`
    - Update order update logic in `/src/app/api/orders/route.ts` to check version before update
    - Implement version increment on every update: `version: { increment: 1 }`
    - Add conflict detection: if version mismatch, return 409 Conflict error
    - _Bug_Condition: isBugCondition_Part1(sessionA, sessionB, operationA, operationB) where concurrent operations on same table/order_
    - _Expected_Behavior: Either serialize operations, detect conflicts, or implement optimistic locking - NO silent data loss_
    - _Preservation: Single device operations and sequential operations continue working_
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 1.4.2 Add API-level role-based authorization
    - Create `/src/lib/role-auth.ts` helper with `requireAdmin()` and `requireStaffOrAdmin()` functions
    - Update `/src/lib/api-auth.ts` to check user.role field from session
    - Protect admin-only endpoints: `/api/menu` (PATCH), `/api/settings`, `/api/staff`
    - Return 403 Forbidden for STAFF role accessing protected endpoints
    - _Requirements: 2.4, 2.5_
  
  - [ ] 1.4.3 Create STAFF accounts
    - Verify ADMIN account exists: business.genzresturant@gmail.com with strong password
    - Create 1-2 STAFF accounts: staff1@genzrestaurant.com, staff2@genzrestaurant.com
    - Set role field to 'STAFF' in User records
    - Document credentials securely
    - _Requirements: 2.6, 2.7_
  
  - [ ] 1.4.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Concurrent Session Data Integrity
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior
    - Run concurrent operation test with optimistic locking implemented
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - no silent data loss)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 1.4.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Concurrent Operations
    - **IMPORTANT**: Re-run the SAME tests from task 1.3 - do NOT write new tests
    - Run preservation tests for single device and sequential operations
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2_

- [ ] 1.5 Checkpoint - Verify Part 1 complete
  - Run all Part 1 tests to ensure they pass
  - Test manually with two devices: concurrent order operations should not lose data
  - Test STAFF account cannot access admin endpoints (returns 403)
  - Ask user if questions arise

## Part 2: Manage Menu - Missing Edit/Category Features

- [ ] 2.1 Write bug condition exploration test - Menu Edit Missing
  - **Property 1: Bug Condition** - Menu Edit Feature Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the feature is missing
  - **GOAL**: Demonstrate that editing existing menu item properties is not possible
  - Test: Call PATCH `/api/menu/[id]` with updated fields (price, name, category)
  - **EXPECTED OUTCOME**: Test FAILS with 404 or 405 (endpoint doesn't exist)
  - Document: No PATCH endpoint exists, no edit UI in ManageMenuModal
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Write preservation property tests - Menu Creation
  - **Property 2: Preservation** - Menu Creation Works
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: POST `/api/menu` with new item → Creates successfully on unfixed code
  - Write property-based test: for all valid menu item data, creation works correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.11_

- [ ] 2.3 Implement menu edit features
  
  - [ ] 2.3.1 Add PATCH endpoint for menu item updates
    - Create `/src/app/api/menu/[id]/route.ts` with PATCH handler
    - Implement authorization: only ADMIN role can edit menu
    - Accept fields: name, price, priceHalf, category, dietType, hasHalfFullOption, stockQuantity
    - Update menu item in database using Prisma
    - Return updated menu item
    - _Requirements: 2.10, 2.13_
  
  - [ ] 2.3.2 Add edit UI to ManageMenuModal
    - Add "Edit" button next to "Mark Unavailable" and "Delete" in menu item row
    - Create edit form state: `showEditForm`, `editingItem`
    - Pre-fill form with current values when Edit clicked
    - Submit calls PATCH endpoint
    - Refresh menu list after successful update
    - _Requirements: 2.8, 2.9_
  
  - [ ] 2.3.3 Implement category dropdown
    - Query existing categories from menu items: `SELECT DISTINCT category FROM MenuItem`
    - Create select/dropdown component showing existing categories
    - Allow typing new category if not in list (combo box pattern)
    - Replace plain text input with category dropdown in add and edit forms
    - _Requirements: 2.11, 2.12_
  
  - [ ] 2.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Menu Edit Functionality
    - Re-run test from task 2.1
    - **EXPECTED OUTCOME**: Test PASSES (PATCH endpoint exists and updates menu item)
    - _Requirements: 2.8, 2.9, 2.10_
  
  - [ ] 2.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Menu Creation Works
    - Re-run tests from task 2.2
    - **EXPECTED OUTCOME**: Tests PASS (menu creation unchanged)
    - _Requirements: 3.11_

- [ ] 2.4 Checkpoint - Verify Part 2 complete
  - Test manually: Edit existing menu item, change price and category
  - Verify category dropdown shows existing categories
  - Verify STAFF accounts cannot edit menu (403 Forbidden)
  - Ask user if questions arise

## Part 3: Service Charge Toggle - Wrong Location

- [ ] 3.1 Write bug condition exploration test - Service Charge Missing
  - **Property 1: Bug Condition** - Service Charge Toggle Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate service charge toggle not in PaymentModal
  - Test: Check PaymentModal for service charge toggle control (similar to GST toggle)
  - **EXPECTED OUTCOME**: Test FAILS (toggle doesn't exist in modal)
  - Document: No serviceChargeApplied state, no toggle UI, no database field
  - _Requirements: 3.1, 3.3_

- [ ] 3.2 Write preservation property tests - GST Toggle
  - **Property 2: Preservation** - GST Toggle Works
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: GST toggle recalculates total → Works on unfixed code
  - Write property-based test: for all bills with GST toggled, calculation is correct
  - Verify test passes on UNFIXED code
  - _Requirements: 3.13_

- [ ] 3.3 Implement service charge toggle
  
  - [ ] 3.3.1 Update database schema
    - Add to Bill model in `prisma/schema.prisma`: `serviceChargeApplied Boolean @default(false)`
    - Add `serviceChargeAmount Decimal @default(0) @db.Decimal(10, 2)`
    - Run `npx prisma migrate dev --name add-service-charge-fields`
    - _Requirements: 3.3_
  
  - [ ] 3.3.2 Add service charge toggle UI
    - Update `/src/components/billing/PaymentModal.tsx`
    - Add state: `serviceChargeApplied` (boolean)
    - Add toggle below GST toggle with same styling
    - Label: "Apply Service Charge (10%)"
    - Wire toggle to recalculate total in real-time
    - _Requirements: 2.14_
  
  - [ ] 3.3.3 Wire service charge calculation
    - Update `calculateFinalTotal()` helper to include service charge
    - Formula: serviceCharge = subtotal * 0.10 (10% of subtotal, before GST)
    - Update total: subtotal + serviceCharge + GST
    - Save serviceChargeApplied and serviceChargeAmount in bill record
    - _Requirements: 2.15, 2.16_
  
  - [ ] 3.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Service Charge Toggle Behavior
    - Re-run test from task 3.1
    - **EXPECTED OUTCOME**: Test PASSES (toggle exists and calculates correctly)
    - _Requirements: 2.14, 2.15, 2.16_
  
  - [ ] 3.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - GST Toggle Works
    - Re-run tests from task 3.2
    - **EXPECTED OUTCOME**: Tests PASS (GST toggle unchanged)
    - _Requirements: 3.13_

- [ ] 3.4 Checkpoint - Verify Part 3 complete
  - Test manually: Toggle service charge in PaymentModal, verify total recalculates
  - Verify serviceChargeApplied and serviceChargeAmount saved in bill
  - Ask user if questions arise

## Part 4: UPI Payment Method - Missing Option

- [ ] 4.1 Write bug condition exploration test - UPI Option Missing
  - **Property 1: Bug Condition** - UPI Payment Method Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate UPI payment button not available
  - Test: Check PaymentModal for UPI button (should have Cash, Card, UPI)
  - **EXPECTED OUTCOME**: Test FAILS (only Cash and Card buttons exist)
  - Document: No UPI option in payment method selection
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Write preservation property tests - Cash Payment
  - **Property 2: Preservation** - Cash Payment Works
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Cash payment stores paymentMethod: 'CASH' → Works on unfixed code
  - Write property-based test: for all cash payments, method stored correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.14_

- [ ] 4.3 Implement UPI payment method
  
  - [ ] 4.3.1 Add UPI button to PaymentModal
    - Update `/src/components/billing/PaymentModal.tsx` payment method grid
    - Add UPI button with 📱 icon (or QR code icon)
    - Position next to Cash and Card buttons
    - Wire click handler to set paymentMethod state to 'UPI'
    - _Requirements: 2.17_
  
  - [ ] 4.3.2 Update payment method storage
    - Ensure bill creation stores paymentMethod: 'UPI' when UPI selected
    - Standardize enum values: 'CASH' | 'UPI' | 'CARD' | 'SPLIT'
    - No QR code generation needed (physical QR at counter)
    - _Requirements: 2.18, 2.19_
  
  - [ ] 4.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - UPI Payment Method Recording
    - Re-run test from task 4.1
    - **EXPECTED OUTCOME**: Test PASSES (UPI button exists, stores correctly)
    - _Requirements: 2.17, 2.18_
  
  - [ ] 4.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Cash Payment Works
    - Re-run tests from task 4.2
    - **EXPECTED OUTCOME**: Tests PASS (cash payment unchanged)
    - _Requirements: 3.14_

- [ ] 4.4 Checkpoint - Verify Part 4 complete
  - Test manually: Select UPI payment, verify paymentMethod: 'UPI' saved
  - Verify Cash and Card payments still work correctly
  - Ask user if questions arise

## Part 5: Revenue Report - No Payment Method Breakdown

- [ ] 5.1 Write bug condition exploration test - Revenue Breakdown Missing
  - **Property 1: Bug Condition** - Payment Method Breakdown Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate revenue report doesn't show payment method breakdown
  - Test: Call `/api/reports` and check response for payment method grouping
  - **EXPECTED OUTCOME**: Test FAILS (only total returned, no breakdown)
  - Document: API returns single total, no cash/UPI/card groups
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 Write preservation property tests - Total Revenue Calculation
  - **Property 2: Preservation** - Total Revenue Correct
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Total revenue calculation sums all bills → Works on unfixed code
  - Write property-based test: for all bills, total revenue = sum of all bill.total
  - Verify test passes on UNFIXED code
  - _Requirements: 3.7_

- [ ] 5.3 Implement revenue report payment method breakdown
  
  - [ ] 5.3.1 Update reports API
    - Update `/src/app/api/reports/route.ts`
    - Group bills by paymentMethod using Prisma groupBy or manual aggregation
    - Calculate sum for each payment method: CASH, UPI, CARD, SPLIT
    - Return breakdown: `{ cash: number, upi: number, card: number, split: number, total: number }`
    - _Requirements: 2.20, 2.22_
  
  - [ ] 5.3.2 Update reports UI
    - Update TodayRevenueModal component (path: `/src/components/dashboard/TodayRevenueModal.tsx`)
    - Display breakdown format: "Cash: ₹X · UPI: ₹Y · Card: ₹Z · Total: ₹W"
    - Show each payment method on separate line or inline with dots
    - Highlight total revenue
    - _Requirements: 2.21_
  
  - [ ] 5.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Revenue Report Payment Method Breakdown
    - Re-run test from task 5.1
    - **EXPECTED OUTCOME**: Test PASSES (breakdown returned by API)
    - _Requirements: 2.20, 2.21, 2.22_
  
  - [ ] 5.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Total Revenue Correct
    - Re-run tests from task 5.2
    - **EXPECTED OUTCOME**: Tests PASS (total calculation unchanged)
    - _Requirements: 3.7_

- [ ] 5.4 Checkpoint - Verify Part 5 complete
  - Test manually: Generate revenue report, verify breakdown shows Cash/UPI/Card amounts
  - Verify total matches sum of breakdown amounts
  - Ask user if questions arise

## Part 6: Receipt Format - No Watermark, Wrong Sizing

- [ ] 6.1 Write bug condition exploration test - Receipt Formatting Issues
  - **Property 1: Bug Condition** - Receipt Format Issues
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate receipt missing watermark and wrong sizing
  - Test: Check receipt CSS for background watermark, @page size: 80mm auto, monospace font
  - **EXPECTED OUTCOME**: Test FAILS (watermark missing, size wrong)
  - Document: No background-image CSS, page size not set, may not be monospace
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6.2 Write preservation property tests - Receipt Content
  - **Property 2: Preservation** - Receipt Content Correct
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Receipt shows header, items, totals, footer → Works on unfixed code
  - Write property-based test: for all bills, receipt content is complete and correct
  - Verify test passes on UNFIXED code
  - _Requirements: 3.8_

- [ ] 6.3 Implement receipt format fixes
  
  - [ ] 6.3.1 Add background watermark
    - Update receipt CSS (ReceiptPrintTemplate or PaymentModal inline HTML)
    - Add background-image: url('/images/Gen-z-logo.png')
    - Set opacity: 0.05-0.1, background-position: center, background-repeat: no-repeat
    - Background-size: 50-60% to fit nicely
    - Keep existing header logo unchanged
    - _Requirements: 2.23_
  
  - [ ] 6.3.2 Fix thermal printer sizing
    - Add @page CSS: `@page { size: 80mm auto; margin: 0; }`
    - Set container width: 72mm (~272px) for content area
    - Ensure receipt container max-width matches 80mm paper width
    - _Requirements: 2.24_
  
  - [ ] 6.3.3 Fix price alignment with monospace font
    - Verify font-family: 'Courier New', monospace is applied
    - Use table layout or explicit column widths for item rows
    - Ensure prices align vertically in right column
    - Test with different item name lengths
    - _Requirements: 2.25_
  
  - [ ] 6.3.4 Consolidate receipt generation if needed
    - If ReceiptPrintTemplate and PaymentModal inline HTML both exist
    - Ensure both use same CSS fixes
    - Consider consolidating to single source of truth
    - _Requirements: 2.26_
  
  - [ ] 6.3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Receipt Format Compliance
    - Re-run test from task 6.1
    - **EXPECTED OUTCOME**: Test PASSES (watermark, size, font correct)
    - _Requirements: 2.23, 2.24, 2.25, 2.26_
  
  - [ ] 6.3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Receipt Content Correct
    - Re-run tests from task 6.2
    - **EXPECTED OUTCOME**: Tests PASS (receipt content unchanged)
    - _Requirements: 3.8_

- [ ] 6.4 Checkpoint - Verify Part 6 complete
  - Test manually: Print receipt, verify watermark visible, size fits 80mm paper, prices aligned
  - Ask user if questions arise

## Part 7: Order Placement Speed - Real Latency

- [ ] 7.1 Investigate order placement latency (CRITICAL FIRST STEP)
  - Add timing logs to `/src/app/api/orders/route.ts`
  - Measure: DB query time, transaction time, total endpoint latency
  - Use `console.time('order-creation')` and `console.timeEnd('order-creation')`
  - Test with realistic data: 5-10 items in order
  - Document findings: Which operation is the actual bottleneck?
  - Potential bottlenecks: Sequential stock updates, Prisma client instantiation, large response payload, client-side computation
  - _Requirements: 7.1, 2.27_

- [ ] 7.2 Write bug condition exploration test - Order Latency
  - **Property 1: Bug Condition** - Order Placement Slow
  - **CRITICAL**: This test documents baseline latency before optimization
  - **GOAL**: Measure "Send to Kitchen" latency before fix
  - Test: Time POST `/api/orders` with 5-10 items
  - **EXPECTED OUTCOME**: Latency > 1500ms (documents the bug)
  - Document: Baseline latency and identified bottleneck from task 7.1
  - _Requirements: 7.1_

- [ ] 7.3 Write preservation property tests - Order Creation Correctness
  - **Property 2: Preservation** - Order Creation Correct
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Orders created with all items, stock decremented → Works on unfixed code
  - Write property-based test: for all orders, data integrity maintained (regardless of speed)
  - Verify test passes on UNFIXED code
  - _Requirements: 3.2, 3.10_

- [ ] 7.4 Implement performance optimization (based on investigation findings)
  
  - [ ] 7.4.1 Optimize identified bottleneck
    - **IF bottleneck is sequential stock updates**: Batch using updateMany or Promise.all
    - **IF bottleneck is Prisma client**: Verify singleton pattern in `/src/lib/prisma.ts`
    - **IF bottleneck is large response**: Use Prisma select to limit returned fields
    - **IF bottleneck is client computation**: Move heavy logic to server or optimize
    - Document exact optimization applied
    - _Requirements: 2.28, 2.29, 2.30, 2.31_
  
  - [ ] 7.4.2 Verify bug condition exploration test shows improvement
    - **Property 1: Expected Behavior** - Order Placement Performance
    - Re-run latency test from task 7.2
    - **EXPECTED OUTCOME**: Measurable latency reduction (document before/after)
    - _Requirements: 2.27, 2.31_
  
  - [ ] 7.4.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Order Creation Correct
    - Re-run tests from task 7.3
    - **EXPECTED OUTCOME**: Tests PASS (correctness maintained)
    - _Requirements: 3.2, 3.10_

- [ ] 7.5 Checkpoint - Verify Part 7 complete
  - Document: Exact bottleneck found, specific optimization applied, before/after metrics
  - Test manually: "Send to Kitchen" should feel faster
  - Ask user if questions arise

## Part 8: Running Table / Table Transfer / KDS Urgent - Interconnected Bugs

### Phase 8A: Investigation (CRITICAL - Must Complete Before Fix)

- [ ] 8.1 Trace running table logic end-to-end
  - Read `/src/app/api/orders/route.ts` lines 132-172 (running table logic)
  - Verify: Does it find existing order by tableId and status?
  - Verify: Does it append OrderItem to existing order or create new Order?
  - Test scenario: Table 1 has order with 2 items → Add 3 more items
  - Check database: How many Order records exist for Table 1? One or two?
  - Document findings: Does running table create second Order record (bug) or append correctly?
  - _Requirements: 8.1, 8.2_

- [ ] 8.2 Trace table transfer logic end-to-end
  - Read `/src/app/api/orders/[id]/transfer/route.ts` lines 54-89 (transfer logic)
  - Verify: Does it update tableId on existing Order record?
  - Verify: Are OrderItems preserved with the Order?
  - Test scenario: Transfer Table 1 order to Table 4 → Add new items to Table 4
  - Check database: Does new item lookup find transferred order correctly?
  - Document findings: Does table transfer break lookup keys for subsequent additions?
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 8.3 Trace KDS urgent detection logic end-to-end
  - Read `/src/app/(pos)/kds/page.tsx` lines 213-257 (urgent detection)
  - Verify: How does it compare previous and current poll data?
  - Verify: Does it handle split orders (if bug 8.1/8.2 create multiple Order records)?
  - Test scenario: Table 1 has 2 items → Add 3 items (should trigger urgent)
  - Check KDS behavior: Does urgent sound play? Does visual indicator appear?
  - Document findings: Is intermittent failure due to incomplete data from bugs 8.1/8.2?
  - _Requirements: 8.6, 8.7, 8.8_

- [ ] 8.4 Document interconnected root causes
  - Synthesize findings from tasks 8.1, 8.2, 8.3
  - Identify: Are bugs 8.1, 8.2, 8.3 caused by same root issue or separate issues?
  - Document: Exact code locations and logic flaws causing each symptom
  - Create fix strategy: Which code changes will fix all three symptoms?
  - _Requirements: All Part 8 requirements_

### Phase 8B: Bug Condition Exploration Tests

- [ ] 8.5 Write bug condition exploration test - Running Table
  - **Property 1: Bug Condition** - Running Table Items Not Aggregating
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate running table items don't show together
  - Test: Create order with 2 items on Table 1 → Add 3 more items to Table 1 → Query order
  - **EXPECTED OUTCOME**: Test FAILS (only 3 items shown, or two separate Order records)
  - Document: Number of Order records, which items are missing
  - _Requirements: 8.1, 8.2_

- [ ] 8.6 Write bug condition exploration test - Table Transfer
  - **Property 1: Bug Condition** - Table Transfer Loses Items
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Demonstrate table transfer loses item continuity
  - Test: Table 1 order with 2 items → Transfer to Table 4 → Add 3 items to Table 4 → Query order
  - **EXPECTED OUTCOME**: Test FAILS (5 items not together, or new items not associated)
  - Document: Order record structure, OrderItem associations after transfer
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 8.7 Write bug condition exploration test - KDS Urgent Detection
  - **Property 1: Bug Condition** - KDS Urgent Detection Intermittent
  - **CRITICAL**: This test MUST FAIL or be inconsistent on unfixed code
  - **GOAL**: Demonstrate KDS doesn't reliably detect running table additions
  - Test: Simulate KDS poll before and after adding items to running order
  - **EXPECTED OUTCOME**: Test FAILS or inconsistent (urgent detection doesn't trigger reliably)
  - Document: KDS comparison logic, why it fails with split/incomplete data
  - _Requirements: 8.6, 8.7, 8.8_

### Phase 8C: Preservation Tests

- [ ] 8.8 Write preservation property tests - New Table Order Creation
  - **Property 2: Preservation** - New Table Order Works
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Order creation for empty table → Works on unfixed code
  - Write property-based test: for all new table orders, creation works correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.2_

- [ ] 8.9 Write preservation property tests - KDS Basic Display
  - **Property 2: Preservation** - KDS Basic Display Works
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: KDS shows active orders grouped by table → Works on unfixed code
  - Write property-based test: for all active orders, KDS displays correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.3_

### Phase 8D: Fix Implementation

- [ ] 8.10 Implement running table fix
  
  - [ ] 8.10.1 Fix running table order lookup
    - Update `/src/app/api/orders/route.ts` running table logic (lines 132-172)
    - Ensure query finds existing Order by tableId with correct status filter
    - Verify: NEVER create second Order for same table with active order
    - Always append OrderItem entities to existing Order
    - _Requirements: 2.32_
  
  - [ ] 8.10.2 Fix running table response data
    - Ensure API response includes ALL OrderItems (old + new) in single Order
    - Return complete order object with all items aggregated
    - _Requirements: 2.33_
  
  - [ ] 8.10.3 Verify running table test passes
    - **Property 1: Expected Behavior** - Running Table Item Aggregation
    - Re-run test from task 8.5
    - **EXPECTED OUTCOME**: Test PASSES (all items in single Order)
    - _Requirements: 2.32, 2.33_

- [ ] 8.11 Implement table transfer fix
  
  - [ ] 8.11.1 Fix table transfer data preservation
    - Update `/src/app/api/orders/[id]/transfer/route.ts` (lines 54-89)
    - Verify: Update tableId on existing Order (not create new Order)
    - Verify: All OrderItems preserved with Order relationship
    - _Requirements: 2.34, 2.35_
  
  - [ ] 8.11.2 Fix post-transfer order lookup
    - Ensure running table logic finds transferred order by updated tableId
    - Test: After transfer to Table 4, adding items to Table 4 finds correct Order
    - _Requirements: 2.36_
  
  - [ ] 8.11.3 Verify table transfer test passes
    - **Property 1: Expected Behavior** - Table Transfer Data Preservation
    - Re-run test from task 8.6
    - **EXPECTED OUTCOME**: Test PASSES (all items preserved after transfer)
    - _Requirements: 2.34, 2.35, 2.36_

- [ ] 8.12 Implement KDS urgent detection fix
  
  - [ ] 8.12.1 Fix KDS item count comparison
    - Update `/src/app/(pos)/kds/page.tsx` urgent detection (lines 213-257)
    - Ensure comparison uses complete order data (after fixes 8.10, 8.11)
    - Compare order.items.length for SAME order ID between polls
    - _Requirements: 2.37, 2.38_
  
  - [ ] 8.12.2 Fix urgent sound and visual indicator
    - Verify urgent sound triggers when item count increases
    - Verify visual indicator appears for running table additions
    - Remove workaround for [URGENT ADDITION] in specialInstructions if present
    - _Requirements: 2.39_
  
  - [ ] 8.12.3 Verify KDS urgent detection test passes
    - **Property 1: Expected Behavior** - KDS Urgent Detection Reliability
    - Re-run test from task 8.7
    - **EXPECTED OUTCOME**: Test PASSES consistently (reliable urgent detection)
    - _Requirements: 2.37, 2.38, 2.39_

### Phase 8E: End-to-End Verification (DEFINITIVE PROOF)

- [ ] 8.13 Run definitive end-to-end verification scenario
  - **Property 1: Expected Behavior** - Complete Running Table Flow
  - **CRITICAL**: This is the DEFINITIVE test that past sessions failed
  - Execute complete flow:
    1. Create order on Table 1 with 2 items (e.g., Paneer Tikka x1, Naan x1)
    2. Verify: Database has ONE Order record for Table 1 with 2 OrderItems
    3. Transfer Table 1 order to Table 4
    4. Verify: Database still has ONE Order record, now with tableId = Table 4, same 2 OrderItems
    5. Add 3 new items to Table 4 (e.g., Dal Makhani x1, Rice x2)
    6. Verify: Database has ONE Order record for Table 4 with exactly 5 OrderItems (2 old + 3 new)
    7. Simulate KDS poll before and after step 5
    8. Verify: KDS detects item count increase (2 → 5), triggers urgent sound and visual indicator
  - Document: Database queries showing single Order with all 5 items
  - Document: KDS urgent detection triggered reliably
  - **EXPECTED OUTCOME**: ALL verifications pass - this proves bug is truly fixed
  - _Requirements: 2.40, 2.41_

- [ ] 8.14 Verify preservation tests still pass
  - **Property 2: Preservation** - New Table Order Works
  - **Property 2: Preservation** - KDS Basic Display Works
  - Re-run tests from tasks 8.8, 8.9
  - **EXPECTED OUTCOME**: Tests PASS (existing functionality preserved)
  - _Requirements: 3.2, 3.3_

- [ ] 8.15 Checkpoint - Verify Part 8 complete
  - Confirm all three symptoms fixed: running table, table transfer, KDS urgent
  - Confirm definitive end-to-end scenario passes (task 8.13)
  - Document root causes found and exact fixes applied
  - Ask user if questions arise

## Final Verification

- [ ] 9.1 Run full build
  - Execute `npm run build` to verify no TypeScript errors
  - Fix any compilation errors
  - Ensure build succeeds

- [ ] 9.2 Manual testing of all 8 parts
  - Test Part 1: Concurrent session isolation with two devices
  - Test Part 2: Edit menu item, use category dropdown
  - Test Part 3: Toggle service charge in PaymentModal
  - Test Part 4: Select UPI payment method
  - Test Part 5: View revenue report with breakdown
  - Test Part 6: Print receipt, verify watermark and sizing
  - Test Part 7: Measure "Send to Kitchen" latency improvement
  - Test Part 8: Complete running table → transfer → add items → KDS urgent flow

- [ ] 9.3 Regression testing
  - Test authentication flow (Google OAuth, email/password)
  - Test order creation for new tables
  - Test bill generation with GST
  - Test menu display and creation
  - Test table status display
  - Test protected routes redirect
  - Verify all preservation requirements still working

- [ ] 9.4 Final checkpoint
  - Ensure all tests pass
  - Ensure all 8 parts fully functional
  - Document any remaining issues or questions for user
  - Request user acceptance testing on production-like environment
