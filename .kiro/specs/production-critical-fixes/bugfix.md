# Bugfix Requirements Document

## Introduction

The GenZ Restaurant POS system (pos.gen-z.online) is a LIVE production Next.js 14 + Prisma system experiencing critical bugs causing active data corruption and operational failures. This bugfix addresses 8 critical production issues organized in priority order, with the highest priority being concurrent session data loss.

**Impact**: These bugs are causing:
- **Data Loss**: User data disappears when same account used on two laptops simultaneously
- **Security Gaps**: No proper role-based access control - staff can modify prices and settings
- **Missing Features**: No way to edit menu items, record UPI payments, or see payment method breakdowns
- **Incorrect UI Placement**: Service charge toggle not where staff need it
- **Print Issues**: Receipts missing watermark and wrong size for 80mm thermal printer
- **Performance**: "Send to Kitchen" genuinely slow
- **Complex Multi-Bug**: Running table items don't show together, table transfer loses items, KDS urgent detection intermittent

**Critical Context**: Past sessions repeatedly claimed "running table" and "KDS urgent sound" fixes worked but they are STILL broken in production. Every fix must be backed by tracing code end-to-end and reproducing bug logic before declaring it fixed.

**Scope**: Fix these 8 critical bugs while maintaining all existing working functionality. This is a LIVE production system with real customer data - no destructive database operations allowed.

## Bug Analysis

### Current Behavior (Defect)

#### Part 1: Data Corruption - Concurrent Session Isolation (HIGHEST PRIORITY)

1.1 WHEN user logs in with same Google/admin credentials (business.genzresturant@gmail.com) on two laptops simultaneously THEN the system causes data to disappear ("data gayab ho jaata hai")

1.2 WHEN two devices with same account make near-simultaneous order updates THEN the last write silently overwrites concurrent changes without merging, causing data loss

1.3 WHEN client-side state holds cart/order items on one laptop AND another laptop triggers fetch/poll THEN stale data from the other laptop overwrites current state

1.4 WHEN staff accounts access admin-only features via API THEN the system does not enforce authorization at API level, allowing unauthorized access to menu editing, price changes, settings, and staff management

1.5 WHEN multiple devices share same login credentials THEN the system has no separate STAFF accounts for individual device sessions

#### Part 2: Manage Menu - Missing Edit/Category Features

2.1 WHEN attempting to edit existing menu item prices THEN the system has no edit action or form available

2.2 WHEN attempting to edit any menu item property (name, category, dietType, half/full price, stock status) THEN the system has no way to modify these values

2.3 WHEN selecting a category for menu items THEN the system has no proper category dropdown with existing categories listed

2.4 WHEN wanting to use an existing category THEN the system does not show available categories to select from

2.5 WHEN updating menu items via API THEN the system may not have proper PATCH/PUT endpoint implemented

#### Part 3: Service Charge Toggle - Wrong Location

3.1 WHEN staff need to toggle service charge during payment collection THEN the toggle is not in the Payment Collection popup where they need it

3.2 WHEN toggling service charge THEN the system does not recalculate totals in real-time like the GST toggle

3.3 WHEN service charge is applied to a bill THEN the system does not save this information with the bill record (like gstApplied field)

#### Part 4: UPI Payment Method - Missing Option

4.1 WHEN receiving payment via UPI (user has physical QR code) THEN the system has no way to record UPI as payment method

4.2 WHEN recording payment THEN the system only has Cash option, not UPI or other methods

4.3 WHEN storing bill payment information THEN the system does not track paymentMethod field distinguishing Cash from UPI

#### Part 5: Revenue Report - No Payment Method Breakdown

5.1 WHEN viewing Today's Revenue report THEN the system shows only total revenue without breakdown by payment method

5.2 WHEN analyzing payment methods THEN the system does not group bills by payment method (Cash/UPI/Card)

5.3 WHEN viewing revenue breakdown THEN the system does not display "Cash: ₹X · UPI: ₹Y · Total: ₹Z" format

#### Part 6: Receipt Format - No Watermark, Wrong Sizing

6.1 WHEN printing receipts THEN the system does not include Gen-z-logo.png as 5-10% opacity background watermark

6.2 WHEN printing to 80mm thermal printer THEN the receipt has wrong paper size settings causing misalignment

6.3 WHEN viewing printed receipt THEN the print CSS does not use @page { size: 80mm auto; margin: 0; } and container width: 72mm

6.4 WHEN reading printed receipt THEN the system does not use monospace font for proper alignment of prices and items

#### Part 7: Order Placement Speed - Real Latency

7.1 WHEN clicking "Send to Kitchen" THEN the system is genuinely slow (not just perception issue)

7.2 WHEN order creation API executes THEN there may be unnecessary sequential database operations that could be parallelized or batched

7.3 WHEN connecting to database THEN Prisma client may not be singleton, causing connection overhead

7.4 WHEN client prepares order request THEN there may be synchronous heavy computation blocking the UI before request

7.5 WHEN order API responds THEN the response payload may be unnecessarily large

#### Part 8: Running Table / Table Transfer / KDS Urgent - Interconnected Bugs

**Symptom A: Running Table Items Not Showing Together**

8.1 WHEN adding items to running table (table with existing order) THEN the system does not show ALL items together (old + new items)

8.2 WHEN creating new items for occupied table THEN the system may create a SECOND Order record instead of appending OrderItem to existing order

**Symptom B: Table Transfer Loses Items**

8.3 WHEN transferring table THEN the system does not move ALL items to the new table

8.4 WHEN adding items after table transfer THEN the new items don't show alongside transferred items

8.5 WHEN table transfer updates tableId THEN the order-creation logic may not correctly find transferred order as "existing order for this table"

**Symptom C: KDS Urgent Detection Intermittent**

8.6 WHEN KDS polls for updates THEN the "urgent" detection for items added to running order only works intermittently

8.7 WHEN comparing item counts for urgency THEN the system may be using incomplete or split order data from bugs 8.2 or 8.5

8.8 WHEN new items added to running order THEN KDS urgent sound and visual indicator do not reliably trigger

### Expected Behavior (Correct)

#### Part 1: Data Corruption - Concurrent Session Isolation Fixed

2.1 WHEN investigating concurrent session data loss THEN the system SHALL identify the actual root cause (client-side state overwrite, API race condition, or simultaneous write conflict) NOT assumed NextAuth session bug

2.2 WHEN two devices make concurrent order updates THEN the system SHALL implement proper conflict resolution or optimistic locking to prevent silent data loss

2.3 WHEN client state is updated from server THEN the system SHALL merge or reconcile data rather than blindly overwriting current state

2.4 WHEN STAFF role attempts to access admin-only API endpoints (edit menu items, change prices, change settings, manage staff, toggle service charge) THEN the system SHALL return 403 Forbidden response

2.5 WHEN STAFF role accesses permitted endpoints (take orders, send to kitchen, generate bills, collect payment, mark items out of stock, use KDS, transfer tables) THEN the system SHALL allow these operations

2.6 WHEN setting up accounts THEN the system SHALL have confirmed ADMIN account for business.genzresturant@gmail.com with strong password

2.7 WHEN creating staff accounts THEN the system SHALL have 1-2 STAFF login accounts (e.g., staff1@genzrestaurant.com) for separate sessions per device

#### Part 2: Manage Menu - Edit and Category Features Implemented

2.8 WHEN viewing Manage Menu page THEN the system SHALL display an "Edit" action button on each menu item

2.9 WHEN clicking Edit on a menu item THEN the system SHALL show a form pre-filled with current values (name, price, category, dietType, half/full price, stock status)

2.10 WHEN submitting edited menu item THEN the system SHALL call PATCH/PUT endpoint to update the menu item in database

2.11 WHEN selecting category for menu item THEN the system SHALL display a proper select/dropdown with EXISTING categories listed

2.12 WHEN viewing category dropdown THEN the system SHALL also allow typing new category name if needed

2.13 WHEN ADMIN role accesses menu edit features THEN the system SHALL allow these operations

#### Part 3: Service Charge Toggle - Correct Location and Behavior

2.14 WHEN viewing Payment Collection modal THEN the system SHALL display service charge toggle directly in the modal, below GST toggle, using same style

2.15 WHEN toggling service charge on/off THEN the system SHALL recalculate total in real-time like GST toggle behavior

2.16 WHEN saving bill with service charge applied THEN the system SHALL store serviceChargeApplied field (similar to gstApplied) in bill record

#### Part 4: UPI Payment Method - Option Available

2.17 WHEN viewing Payment Collection modal THEN the system SHALL display "UPI" button next to Cash button

2.18 WHEN selecting UPI payment method THEN the system SHALL store paymentMethod: 'UPI' in bill record (no QR code generation needed, purely a label)

2.19 WHEN recording UPI payment THEN the system SHALL flow into revenue reporting with payment method tracked

#### Part 5: Revenue Report - Payment Method Breakdown Displayed

2.20 WHEN generating revenue report THEN the system SHALL group bills by payment method in reports API

2.21 WHEN viewing Today's Revenue THEN the system SHALL display breakdown format: "Cash: ₹X · UPI: ₹Y · Total: ₹Z"

2.22 WHEN calculating payment method totals THEN the system SHALL sum bills by their paymentMethod field

#### Part 6: Receipt Format - Watermark and Proper Sizing

2.23 WHEN printing receipt THEN the system SHALL include Gen-z-logo.png as 5-10% opacity background watermark (keeping existing header logo)

2.24 WHEN printing to thermal printer THEN the system SHALL use print CSS: @page { size: 80mm auto; margin: 0; } and container width: 72mm

2.25 WHEN formatting receipt text THEN the system SHALL use monospace font for alignment of prices and items

2.26 WHEN generating receipt layout THEN the system SHALL follow standard format: header → bill#/date/table → items → subtotal → GST → service charge → total → payment → footer

#### Part 7: Order Placement Speed - Actual Bottleneck Fixed

2.27 WHEN investigating "Send to Kitchen" latency THEN the system SHALL identify the actual bottleneck (sequential DB operations, connection overhead, heavy client computation, or large payload)

2.28 WHEN order creation API executes THEN the system SHALL use parallelized or batched database operations where possible

2.29 WHEN connecting to database THEN the system SHALL use Prisma client singleton pattern for connection reuse

2.30 WHEN order API responds THEN the system SHALL optimize response payload size by excluding unnecessary data

2.31 WHEN reporting fix THEN the system SHALL document exactly what was found and changed (not just adding spinner)

#### Part 8: Running Table / Table Transfer / KDS Urgent - Root Causes Fixed

**Fix for Symptom A: Complete Order Data Integrity**

2.32 WHEN adding items to occupied table with existing order THEN the system SHALL find existing order record and append OrderItem entities (never create second Order for same table)

2.33 WHEN querying order items THEN the system SHALL return ALL OrderItems associated with the Order, showing old + new items together

**Fix for Symptom B: Table Transfer Preserves All Data**

2.34 WHEN transferring table THEN the system SHALL update tableId on the EXISTING Order record (not create new order)

2.35 WHEN transferring table THEN the system SHALL preserve full OrderItem history associated with the Order

2.36 WHEN adding items after table transfer THEN the order-creation logic SHALL correctly identify transferred order as "existing order for this table" using updated lookup keys

**Fix for Symptom C: KDS Urgent Detection with Correct Data**

2.37 WHEN KDS polls for updates THEN the system SHALL use COMPLETE order data (after fixes 2.32-2.36) for item-count comparison

2.38 WHEN comparing item counts THEN the system SHALL correctly identify items added to running order as "urgent"

2.39 WHEN new items detected THEN KDS SHALL reliably trigger urgent sound and visual indicator

**Definitive Verification Trace**

2.40 WHEN testing complete flow (Table 1 gets order with 2 items → Transfer to Table 4 → Add 3 more items to Table 4) THEN the system SHALL show resulting Order with all 5 items associated with Table 4

2.41 WHEN KDS receives update after adding 3 items THEN the system SHALL identify those 3 new items as "urgent" (added to running order)

### Unchanged Behavior (Regression Prevention)

#### 3.1 Authentication Continues Working
3.1 WHEN users log in with valid credentials via Google OAuth or email/password THEN the system SHALL CONTINUE TO authenticate successfully and maintain sessions using NextAuth

#### 3.2 Order Creation for New Tables Continues Working
3.2 WHEN creating new order for empty/available table THEN the system SHALL CONTINUE TO create Order record, update table status to OCCUPIED, and store OrderItems correctly

#### 3.3 Kitchen Display System (KDS) Basic Display Continues Working
3.3 WHEN viewing KDS screen THEN the system SHALL CONTINUE TO display active orders grouped by table with item details

#### 3.4 Bill Generation Continues Working
3.4 WHEN generating bill for completed order THEN the system SHALL CONTINUE TO calculate subtotal, GST, service charge (if toggle added in Part 3), and total correctly

#### 3.5 Menu Display Continues Working
3.5 WHEN viewing menu in order-taking interface THEN the system SHALL CONTINUE TO display all available menu items with prices, categories, and dietary types

#### 3.6 Table Status Display Continues Working
3.6 WHEN viewing tables list THEN the system SHALL CONTINUE TO show table status (AVAILABLE/OCCUPIED), table number, and capacity

#### 3.7 Reports for Single Payment Method Continue Working
3.7 WHEN viewing revenue reports with all payments via one method THEN the system SHALL CONTINUE TO calculate total revenue correctly (even before Part 5 breakdown feature)

#### 3.8 Receipt Header and Footer Continue Working
3.8 WHEN printing receipt THEN the system SHALL CONTINUE TO display restaurant name, address, bill number, date, and footer text (watermark is additional in Part 6)

#### 3.9 Order Status Workflow Continues Working
3.9 WHEN kitchen staff updates order status (PENDING → PREPARING → READY → SERVED → COMPLETED) THEN the system SHALL CONTINUE TO update status correctly

#### 3.10 Database Relationships Continue Working
3.10 WHEN querying related data (Orders with OrderItems, Bills with Orders, Tables with Orders) THEN the system SHALL CONTINUE TO maintain referential integrity through Prisma relationships

#### 3.11 Menu Creation Continues Working
3.11 WHEN creating new menu items (not editing) THEN the system SHALL CONTINUE TO accept name, price, category, dietType and save to database

#### 3.12 Protected Routes Continue Working
3.12 WHEN accessing protected routes without authentication THEN the system SHALL CONTINUE TO redirect to login page via middleware

#### 3.13 GST Toggle Continues Working
3.13 WHEN toggling GST on/off in payment collection THEN the system SHALL CONTINUE TO recalculate total in real-time and save gstApplied field

#### 3.14 Cash Payment Method Continues Working
3.14 WHEN selecting Cash payment method THEN the system SHALL CONTINUE TO store paymentMethod: 'CASH' in bill record (before UPI added in Part 4)
