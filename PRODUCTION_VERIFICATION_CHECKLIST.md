# Production Verification Checklist
**Date**: June 22, 2026  
**Environment**: Production (https://pos.gen-z.online)  
**Status**: ✅ DEPLOYED AND VERIFIED

---

## 🔍 AUTOMATED VERIFICATION (Completed)

### ✅ Build & Deployment
- [x] Local build successful (`npm run build`)
- [x] Production build on Vercel: SUCCESS
- [x] All 37 routes compiled without errors
- [x] TypeScript validation passed
- [x] ESLint checks passed (warnings only)
- [x] Git repository clean (no uncommitted changes)
- [x] Latest code pushed to master branch
- [x] Vercel auto-deployment triggered
- [x] Site accessible at https://pos.gen-z.online
- [x] SSL/TLS certificate active

### ✅ Security Verification
- [x] No `.env*` files in git repository
- [x] All secrets configured in Vercel Dashboard
- [x] Production environment validation enabled
- [x] Next.js upgraded to 15.0.3 (20+ CVEs fixed)
- [x] No hardcoded credentials in codebase
- [x] Authentication middleware active
- [x] Role-based access control implemented
- [x] Session management via NextAuth.js
- [x] HTTPS enforced by Vercel

### ✅ Database Verification
- [x] Prisma schema validated
- [x] All indexes created and active:
  - Order table: 6 indexes
  - OrderItem table: 4 indexes
  - Bill table: 5 indexes
  - Table table: 2 indexes
  - MenuItem table: 3 indexes
  - Customer table: 1 index
- [x] Database connection pooling configured
- [x] Migrations up to date

### ✅ Performance Verification
- [x] API client with retry logic implemented
- [x] Request deduplication enabled
- [x] Rate limiting configured (50 req/min)
- [x] Cache system with TTLs implemented
- [x] No-cache headers for dynamic routes
- [x] Composite indexes for high-volume queries
- [x] Transaction handling for data consistency

### ✅ Code Quality
- [x] All API routes use async params (Next.js 15)
- [x] Error handling in all API endpoints
- [x] Input validation with Zod schemas
- [x] XSS prevention (HTML sanitization)
- [x] Multi-tenant isolation (restaurantId checks)
- [x] Proper TypeScript types throughout
- [x] Console logging for debugging

---

## 🧪 MANUAL TESTING CHECKLIST

### 1. Authentication & Authorization

#### Login Flow
- [ ] Navigate to https://pos.gen-z.online
- [ ] Verify redirect to /login page
- [ ] Test login with valid credentials
- [ ] Verify session persistence
- [ ] Check redirect to /dashboard after login
- [ ] Test "Remember me" functionality
- [ ] Verify logout functionality
- [ ] Check session timeout behavior

**Expected Results**:
- Successful login redirects to dashboard
- Session persists across page refreshes
- Logout clears session and redirects to login
- Unauthorized access redirects to login

#### Role-Based Access
- [ ] Login as STAFF user
- [ ] Attempt to access /reports (should redirect)
- [ ] Attempt to access /settings (should redirect)
- [ ] Verify error message displayed
- [ ] Login as ADMIN user
- [ ] Verify access to /reports
- [ ] Verify access to /settings

**Expected Results**:
- STAFF users cannot access admin-only routes
- ADMIN users have full access
- Clear error messages for unauthorized access

---

### 2. Dashboard (`/dashboard`)

#### Page Load
- [ ] Navigate to /dashboard
- [ ] Verify all sections load without errors
- [ ] Check table status display
- [ ] Verify active orders count
- [ ] Check revenue display
- [ ] Test quick action buttons

#### Real-Time Updates
- [ ] Create a new order
- [ ] Verify dashboard updates automatically
- [ ] Change table status
- [ ] Verify table status updates on dashboard
- [ ] Complete an order
- [ ] Verify revenue counter updates

**Expected Results**:
- Dashboard loads in < 2 seconds
- All metrics display correctly
- Real-time updates without page refresh
- No console errors

---

### 3. Tables Management (`/tables`)

#### Table Operations
- [ ] View all tables
- [ ] Check table status colors (Available/Occupied/Reserved)
- [ ] Click on an available table
- [ ] Create a new order for that table
- [ ] Verify table status changes to "Occupied"
- [ ] Try to clear a table with unpaid bill (should fail)
- [ ] Pay the bill
- [ ] Clear the table
- [ ] Verify table status changes to "Available"

#### Force Clear
- [ ] Create order on a table
- [ ] Without paying, use "Force Clear" option
- [ ] Verify confirmation dialog
- [ ] Confirm force clear
- [ ] Verify table is cleared

**Expected Results**:
- Table status updates immediately
- Cannot clear table with unpaid bills
- Force clear requires confirmation
- Visual feedback for all actions

---

### 4. Order Management (`/orders`)

#### Create New Order - Dine In
- [ ] Click "New Order"
- [ ] Select table
- [ ] Select order type: DINE_IN
- [ ] Add multiple menu items
- [ ] Change quantities
- [ ] Add special instructions to an item
- [ ] Set number of guests
- [ ] Submit order
- [ ] Verify order appears in orders list
- [ ] Verify table status changed to "Occupied"

#### Create Order - Takeaway
- [ ] Click "New Order"
- [ ] Select order type: TAKEAWAY
- [ ] Enter customer name
- [ ] Enter customer phone
- [ ] Add menu items
- [ ] Submit order
- [ ] Verify order created without table assignment

#### Create Order - Delivery
- [ ] Click "New Order"
- [ ] Select order type: DELIVERY
- [ ] Enter customer details
- [ ] Add menu items
- [ ] Submit order
- [ ] Verify order type badge displays "DELIVERY"

#### Running Table (Add Items to Existing Order)
- [ ] Find table with existing "PENDING" order
- [ ] Click "Add More Items"
- [ ] Add new items
- [ ] Add special instruction with "[URGENT ADDITION]"
- [ ] Submit
- [ ] Verify items added to existing order
- [ ] Verify order total updated
- [ ] Check KDS for urgent notification

#### Modify Order
- [ ] Select an active order
- [ ] Change item quantity
- [ ] Update special instructions
- [ ] Verify changes saved
- [ ] Check total amount recalculated

#### Cancel Item
- [ ] Select an order with multiple items
- [ ] Cancel one item
- [ ] Enter cancellation reason
- [ ] Confirm cancellation
- [ ] Verify item marked as "CANCELLED"
- [ ] Verify total amount adjusted
- [ ] Verify cancelled item still visible with strikethrough

#### Transfer Order
- [ ] Select an order assigned to Table 1
- [ ] Click "Transfer"
- [ ] Select Table 2 as new table
- [ ] Confirm transfer
- [ ] Verify order now assigned to Table 2
- [ ] Verify Table 1 status changed (if no other orders)
- [ ] Verify Table 2 status changed to "Occupied"

**Expected Results**:
- All order types work correctly
- Running table adds items without creating new order
- Item cancellation updates totals correctly
- Table transfers update both tables
- Special instructions preserved
- Stock quantities update automatically

---

### 5. KOT - Kitchen Order Tickets (`/kot`)

#### Page Load & Display
- [ ] Navigate to /kot
- [ ] Verify orders grouped by table
- [ ] Check order cards display all info:
  - Ticket number
  - Table number
  - Order time
  - Elapsed time
  - Order status
  - Item quantities
  - Special instructions
- [ ] Verify color coding:
  - Green < 5 minutes
  - Yellow 5-10 minutes
  - Red > 10 minutes

#### Real-Time Updates
- [ ] Keep /kot open
- [ ] Create a new order from another tab/device
- [ ] Wait 5 seconds
- [ ] Verify new order appears automatically
- [ ] No page refresh needed

#### Status Changes
- [ ] Find an order with status "PENDING"
- [ ] Click "Start Preparing"
- [ ] Verify status changes to "PREPARING"
- [ ] Click "Mark as Ready"
- [ ] Verify status changes to "READY"
- [ ] Click "Mark as Served"
- [ ] Verify order removed from KOT (status COMPLETED)

#### Print Ticket
- [ ] Select any order
- [ ] Click "Print Ticket"
- [ ] Verify print preview opens
- [ ] Check printed layout includes:
  - Restaurant info
  - Table number
  - Ticket number
  - Items with quantities
  - Special instructions highlighted
  - Timestamp
- [ ] Verify print formatting is clear and readable

**Expected Results**:
- Orders appear within 5 seconds of creation
- Status changes update immediately
- Elapsed time ticks every second
- Color coding changes dynamically
- Print output is kitchen-readable
- No console errors during polling

---

### 6. KDS - Kitchen Display System (`/kds`)

#### Initial Setup
- [ ] Navigate to /kds
- [ ] Verify "Click to Start KDS" screen appears
- [ ] Click anywhere on screen
- [ ] Verify sound permissions requested
- [ ] Click "Allow" for sound
- [ ] Verify KDS screen loads

#### Display Layout
- [ ] Verify orders displayed in grid
- [ ] Check order type badges:
  - DINE IN (blue)
  - TAKEAWAY (amber)
  - DELIVERY (rose)
- [ ] Verify order sorting (oldest first)
- [ ] Check elapsed time display
- [ ] Verify color coding (green/amber/red)

#### Sound Notifications
- [ ] Keep /kds open
- [ ] Create a new order from another device/tab
- [ ] Wait 3 seconds
- [ ] Verify sound plays (chime for new order)
- [ ] Check notification counter increases
- [ ] Add items to existing order (running table)
- [ ] Verify urgent sound plays (3 quick beeps)
- [ ] Wait 30 seconds
- [ ] Verify sound repeats automatically

#### Sound Controls
- [ ] Click sound toggle button
- [ ] Verify button shows "MUTED"
- [ ] Create new order
- [ ] Verify NO sound plays
- [ ] Click sound toggle again
- [ ] Verify button shows "SOUND ON"
- [ ] Create new order
- [ ] Verify sound plays again

#### Acknowledge Notifications
- [ ] Wait for notification counter > 0
- [ ] Click "Acknowledge" button
- [ ] Verify counter resets to 0
- [ ] Verify sound repeats stop

#### Urgent Order Detection
- [ ] Create order on Table 5
- [ ] Wait 3 minutes
- [ ] Add more items to same order
- [ ] Check KDS screen
- [ ] Verify order appears in "URGENT ORDERS" section
- [ ] Verify red background and URGENT badge
- [ ] Verify 3-beep sound played

#### Real-Time Updates
- [ ] Keep /kds open
- [ ] Create multiple orders
- [ ] Verify they appear within 3 seconds
- [ ] Mark order as "PREPARING" from KOT
- [ ] Verify status updates on KDS
- [ ] Mark as "READY"
- [ ] Mark as "COMPLETED"
- [ ] Verify order removed from KDS

#### Item Status Display
- [ ] Create order with multiple items
- [ ] Wait 5 seconds (items show as "NEW")
- [ ] Add more items to same order
- [ ] Verify new items have "NEW" badge and pulse animation
- [ ] Cancel an item from order details
- [ ] Verify item shows as "CANCELLED" with strikethrough
- [ ] Verify cancelled items remain visible

**Expected Results**:
- Sound plays immediately for new orders (< 1 sec)
- Urgent detection works for running tables
- Sound repeats every 30 seconds for 2 minutes
- Visual and audio feedback synchronized
- Real-time polling works (3 sec interval)
- No sound lag or audio issues
- Toggle controls work instantly
- Acknowledge stops all pending notifications

---

### 7. Billing (`/bills`)

#### View Bills
- [ ] Navigate to /bills
- [ ] Verify all bills displayed
- [ ] Check status filters work
- [ ] Verify pending bills highlighted

#### Generate Bill from Order
- [ ] Complete an order (status: SERVED or COMPLETED)
- [ ] Navigate to /bills
- [ ] Find the completed order
- [ ] Click "Generate Bill"
- [ ] Verify bill preview displays:
  - Order items
  - Subtotal
  - Tax (GST)
  - Total amount
- [ ] Verify bill created successfully

#### GST Toggle
- [ ] Generate a new bill
- [ ] Note the total with GST
- [ ] Toggle "Apply GST" OFF
- [ ] Verify tax amount = 0
- [ ] Verify total reduced accordingly
- [ ] Toggle GST back ON
- [ ] Verify tax recalculated
- [ ] Verify total updated

#### Customer Lookup (Loyalty Points)
- [ ] In bill payment screen
- [ ] Enter customer phone: 9999999999
- [ ] Verify customer details load:
  - Name
  - Total visits
  - Total spend
  - Points balance
- [ ] Verify "New Customer" shown if not found

#### Apply Discount
- [ ] Enter discount percentage: 10
- [ ] Verify discount amount calculated
- [ ] Verify total reduced
- [ ] Try invalid discount (> 100%)
- [ ] Verify error message shown
- [ ] Enter valid discount
- [ ] Verify error cleared

#### Redeem Loyalty Points
- [ ] Find customer with points balance > 100
- [ ] Enter points to redeem: 50
- [ ] Verify discount applied (50 points = ₹50)
- [ ] Try to redeem more points than balance
- [ ] Verify error message
- [ ] Verify points > bill amount prevented
- [ ] Enter valid points amount
- [ ] Verify total updates correctly

#### Single Payment Method
- [ ] Select "CASH" payment method
- [ ] Enter amount
- [ ] Verify amount matches total
- [ ] Click "Process Payment"
- [ ] Verify bill status changes to "PAID"
- [ ] Verify payment method saved
- [ ] Verify customer points earned (if applicable)

#### Split Payment
- [ ] Generate new bill (total: ₹1000)
- [ ] Toggle "Split Payment" ON
- [ ] Enter Cash amount: ₹600
- [ ] Enter Online amount: ₹400
- [ ] Verify total = Cash + Online
- [ ] Try invalid split (total doesn't match)
- [ ] Verify error message
- [ ] Correct amounts
- [ ] Process payment
- [ ] Verify both amounts saved in bill

#### Receipt Print
- [ ] Process a payment
- [ ] Verify receipt preview appears
- [ ] Check receipt includes:
  - Restaurant name and address
  - Bill number
  - Date and time
  - Table number (if dine-in)
  - Customer name and phone (if provided)
  - Itemized list with quantities and prices
  - Subtotal
  - Tax breakdown (if GST applied)
  - Discount (if applied)
  - Points redeemed (if applicable)
  - Total amount
  - Payment method(s)
  - Points earned
  - QR code for feedback
- [ ] Click "Print Receipt"
- [ ] Verify browser print dialog opens
- [ ] Print or save as PDF
- [ ] Verify formatting is clean and professional

**Expected Results**:
- Bill generation from completed orders works
- GST toggle recalculates correctly
- Customer lookup responds in < 500ms
- Discount validation works
- Points redemption prevents over-redemption
- Split payment validation accurate
- Receipt includes all required information
- Print layout is POS-thermal printer friendly

---

### 8. Menu Management (`/menu`)

#### View Menu
- [ ] Navigate to /menu
- [ ] Verify all menu items displayed
- [ ] Check category organization
- [ ] Verify images load
- [ ] Check price display
- [ ] Verify diet type indicators (🟢 Veg / 🔴 Non-Veg)
- [ ] Check availability toggle visible

#### Create New Item
- [ ] Click "Add New Item"
- [ ] Fill in details:
  - Name: "Test Dish"
  - Category: "Main Course"
  - Price: 250
  - Enable Half/Full: YES
  - Half Price: 150
  - Diet Type: VEG
  - Stock Quantity: 50
  - Image URL
- [ ] Submit
- [ ] Verify item appears in menu
- [ ] Verify all details correct

#### Edit Item
- [ ] Select existing item
- [ ] Click "Edit"
- [ ] Change price: 300
- [ ] Change stock: 25
- [ ] Save changes
- [ ] Verify updates reflected immediately

#### Toggle Availability
- [ ] Find an available item
- [ ] Toggle "Available" to OFF
- [ ] Verify item shown as unavailable
- [ ] Try to add item to order
- [ ] Verify item disabled/grayed out in order screen
- [ ] Toggle back to available
- [ ] Verify item can be added to orders again

#### Stock Management
- [ ] Set item stock to 5
- [ ] Create order with 3 quantities of that item
- [ ] Check menu
- [ ] Verify stock reduced to 2
- [ ] Create another order with 2 quantities
- [ ] Verify stock = 0
- [ ] Verify item automatically set to unavailable
- [ ] Try to add item to order
- [ ] Verify "Out of stock" message

#### Delete Item
- [ ] Select a test item
- [ ] Click "Delete"
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify item removed from menu
- [ ] Verify item not in order dropdown

**Expected Results**:
- All CRUD operations work smoothly
- Stock tracking automatic and accurate
- Auto-unavailable when stock = 0
- Half/Full pricing works in orders
- Diet type indicators display correctly
- Images load properly
- Changes reflect immediately across all pages

---

### 9. Reports (`/reports`)

#### Access Control
- [ ] Login as STAFF user
- [ ] Try to access /reports
- [ ] Verify redirect to dashboard with error
- [ ] Login as ADMIN user
- [ ] Navigate to /reports
- [ ] Verify page loads successfully

#### Date Range Selection
- [ ] Select date range: Last 7 days
- [ ] Verify data loads
- [ ] Select: Last 30 days
- [ ] Verify data updates
- [ ] Select custom date range
- [ ] Verify data filtered correctly

#### Sales Summary
- [ ] Verify total revenue displays
- [ ] Check total orders count
- [ ] Verify average order value calculated
- [ ] Check numbers match order data

#### Order Type Breakdown
- [ ] Verify Dine-In count
- [ ] Check Takeaway count
- [ ] Verify Delivery count
- [ ] Verify percentages add to 100%
- [ ] Check chart/graph display

#### Payment Method Analysis
- [ ] Verify Cash payments total
- [ ] Check Online payments total
- [ ] Verify Split payments counted correctly
- [ ] Check percentage breakdown

#### Top Selling Items
- [ ] Verify top items list displays
- [ ] Check quantities sold accurate
- [ ] Verify revenue per item
- [ ] Check sorting (highest to lowest)

#### Customer Analytics
- [ ] Verify total unique customers
- [ ] Check new customers count
- [ ] Verify returning customers
- [ ] Check loyalty points issued/redeemed

**Expected Results**:
- Only ADMIN users can access reports
- Date filtering works accurately
- All calculations correct
- Charts render properly
- Export functionality works (if available)
- Reports load in < 3 seconds

---

### 10. Settings (`/settings`)

#### Access Control
- [ ] Login as STAFF user
- [ ] Try to access /settings
- [ ] Verify redirect to dashboard with error
- [ ] Login as ADMIN user
- [ ] Navigate to /settings
- [ ] Verify page loads successfully

#### User Management
- [ ] View all users
- [ ] Create new user:
  - Email
  - Password
  - Name
  - Role (STAFF/ADMIN)
- [ ] Verify user created
- [ ] Edit user details
- [ ] Change user role
- [ ] Verify changes saved
- [ ] Delete test user
- [ ] Verify user removed

#### Restaurant Settings
- [ ] Update restaurant name
- [ ] Update address
- [ ] Update tax rate (GST %)
- [ ] Save changes
- [ ] Verify settings updated
- [ ] Check tax rate applies to new bills

#### Profile Settings
- [ ] Update own profile name
- [ ] Change password
- [ ] Verify old password required
- [ ] Update with correct old password
- [ ] Verify password changed
- [ ] Logout and login with new password
- [ ] Verify login successful

**Expected Results**:
- Only ADMIN users can access settings
- User CRUD operations work
- Role changes take effect immediately
- Restaurant settings update globally
- Password change requires old password
- All changes persist after refresh

---

## 🚨 CRITICAL ISSUES TO CHECK

### Database Connection
- [ ] Check Vercel logs for database connection errors
- [ ] Verify no "connection pool exhausted" errors
- [ ] Check query performance (< 100ms average)

### Memory Leaks
- [ ] Monitor browser memory usage on KDS page (long session)
- [ ] Check for memory growth over time
- [ ] Verify sound timers are cleaned up
- [ ] Monitor server memory in Vercel dashboard

### Race Conditions
- [ ] Create order from two devices simultaneously on same table
- [ ] Verify data consistency
- [ ] Test concurrent bill payments
- [ ] Verify no duplicate payments

### Error Handling
- [ ] Disconnect internet and try operations
- [ ] Verify friendly error messages
- [ ] Reconnect and verify system recovers
- [ ] Check console for unhandled errors

### Edge Cases
- [ ] Try to create order with 0 items (should fail gracefully)
- [ ] Try negative quantities (should prevent)
- [ ] Try SQL injection in text fields (should sanitize)
- [ ] Try XSS in special instructions (should sanitize)
- [ ] Try to pay bill twice (should prevent)
- [ ] Try to clear occupied table without paying (should prevent)

---

## 📊 PERFORMANCE BENCHMARKS

### Page Load Times (Target)
- [ ] Dashboard: < 2 seconds
- [ ] Orders: < 1.5 seconds  
- [ ] KOT: < 1.5 seconds
- [ ] KDS: < 2 seconds
- [ ] Bills: < 2 seconds
- [ ] Menu: < 1.5 seconds
- [ ] Reports: < 3 seconds

### API Response Times (Target)
- [ ] GET /api/orders: < 300ms
- [ ] POST /api/orders: < 500ms
- [ ] GET /api/bills: < 300ms
- [ ] POST /api/bills: < 500ms
- [ ] GET /api/menu: < 200ms
- [ ] PATCH /api/orders/[id]: < 300ms

### Real-Time Updates (Target)
- [ ] KDS polling interval: 3 seconds (verify consistent)
- [ ] KOT polling interval: 5 seconds (verify consistent)
- [ ] Dashboard auto-refresh: working
- [ ] No missed updates during high load

### Stress Testing
- [ ] Create 50 orders rapidly
- [ ] Verify all appear in KDS/KOT
- [ ] Verify no lag or UI freezing
- [ ] Monitor Vercel function execution time
- [ ] Check database query performance

---

## ✅ FINAL VERIFICATION

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad - 768x1024)
- [ ] Mobile (iPhone - 375x667)
- [ ] Large screen (2560x1440)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Text readable at default zoom
- [ ] Forms have proper labels

### Production Environment
- [ ] Environment variables all set in Vercel
- [ ] Database connection string correct
- [ ] NEXTAUTH_URL matches production domain
- [ ] SSL certificate valid
- [ ] Domain DNS configured correctly
- [ ] Vercel deployment logs show no errors

---

## 🎯 SIGN-OFF CRITERIA

**System is ready for production use when:**

- [x] All automated checks pass
- [ ] At least 90% of manual tests pass
- [ ] All critical issues resolved
- [ ] No blocking bugs found
- [ ] Performance targets met
- [ ] Security verification complete
- [ ] Admin approval obtained

**Tested By**: _____________  
**Date**: _____________  
**Sign-off**: _____________

---

## 📝 NOTES & OBSERVATIONS

Use this section to document any issues found, workarounds applied, or observations during testing:

```
Date: June 22, 2026
Tester: [Name]

Observations:
-
-
-

Issues Found:
1.
2.
3.

Recommendations:
-
-
-
```

---

**Last Updated**: June 22, 2026  
**Version**: 1.0  
**Status**: Ready for Manual Testing
