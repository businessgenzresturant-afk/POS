# Production Audit - Requirements Document

## Overview
Comprehensive end-to-end testing of GenZ Restaurant POS before production deployment. This audit will validate the entire restaurant workflow from order creation to bill payment, ensuring zero customer-facing bugs.

## Background
Previous sessions claimed "production ready" with "0 errors" but manual testing revealed critical bugs:
- COMPLETED orders appearing in new bills (double billing)
- Receipt printing twice
- Table status inconsistencies
- Running table workflow gaps

**Critical Principle**: Every fix must be verified with actual testing, not just code inspection.

---

## 1. FUNCTIONAL TESTING (100+ Test Cases)

### 1.1 Authentication & Authorization (8 cases)
**Priority**: HIGH  
**Goal**: Ensure only authorized users can access their restaurant's data

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| AUTH-01 | Admin login with valid credentials | Redirects to dashboard | Can access all features |
| AUTH-02 | Staff login with valid credentials | Redirects to dashboard | Limited to staff permissions |
| AUTH-03 | Login with invalid credentials | Shows error message | No access granted |
| AUTH-04 | Staff tries to access admin-only features (>15% discount) | Error/blocked | Staff max discount = 15% |
| AUTH-05 | Multi-tenant isolation: User A cannot see User B's orders | Empty results | Only own restaurant data visible |
| AUTH-06 | Session persistence after page refresh | Stays logged in | No re-login required |
| AUTH-07 | Logout functionality | Redirects to login | Session cleared |
| AUTH-08 | Concurrent sessions (same user, 2 devices) | Both work | No conflicts |

---

### 1.2 Table Management (12 cases)
**Priority**: CRITICAL  
**Goal**: Table status accuracy throughout entire workflow

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| TBL-01 | View all tables on dashboard | Shows all tables with correct status | Matches actual state |
| TBL-02 | Create order → Table status changes to OCCUPIED | Status = OCCUPIED | Instant update |
| TBL-03 | Order status → SERVED → Table status = RUNNING | Status = RUNNING | Auto-transition |
| TBL-04 | Add items to RUNNING table | Table stays RUNNING, items added to same order | No new order created |
| TBL-05 | Generate bill → Table status = AVAILABLE | Status = AVAILABLE | Clears immediately |
| TBL-06 | Multiple orders on same table (edge case) | Only 1 active order at a time | No conflicts |
| TBL-07 | Table capacity display | Shows correct capacity | Matches database |
| TBL-08 | Reserved table cannot take orders | Error message | Status check works |
| TBL-09 | Two devices try to occupy same table (race condition) | First succeeds, second fails | Transaction safety |
| TBL-10 | Order cancelled → Table becomes AVAILABLE | Status = AVAILABLE | Only if no other orders |
| TBL-11 | Table number uniqueness per restaurant | Each table has unique number | No duplicates |
| TBL-12 | Takeaway/Delivery orders (no table) | Order created without tableId | Works correctly |

---

### 1.3 Menu Management (10 cases)
**Priority**: MEDIUM  
**Goal**: Menu items display correctly with accurate pricing

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| MENU-01 | View all menu items by category | Items grouped by category | All categories visible |
| MENU-02 | Half/Full portion options | Both prices shown, correct price applied | Amount = selected portion |
| MENU-03 | VEG/NON-VEG indicators | Correct icons/labels | Matches item type |
| MENU-04 | Out-of-stock items | Marked as unavailable, cannot order | Error on attempt |
| MENU-05 | Stock tracking: Order reduces stock | Stock decrements by quantity | Accurate count |
| MENU-06 | Stock = 0 → Item becomes unavailable | available = false | Auto-disabled |
| MENU-07 | Menu item search/filter | Finds correct items | Fast response |
| MENU-08 | Special instructions field | Text saved with order | Appears in KDS |
| MENU-09 | Price display consistency | Same price everywhere (menu, order, bill) | No discrepancies |
| MENU-10 | Menu item images | Display correctly | No broken images |

---

### 1.4 Order Creation & Management (25 cases)
**Priority**: CRITICAL  
**Goal**: Orders are created accurately and flow through statuses correctly

#### Order Creation (10 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| ORD-01 | Create dine-in order (table + items) | Order created, Table OCCUPIED | orderType = DINE_IN |
| ORD-02 | Create takeaway order (no table) | Order created, no table association | orderType = TAKEAWAY |
| ORD-03 | Create delivery order | Order created with customer details | orderType = DELIVERY |
| ORD-04 | Add 1 item to order | Item appears with correct quantity & price | totalAmount correct |
| ORD-05 | Add 10 items to order | All items appear | totalAmount = sum of all |
| ORD-06 | Add same item twice | Quantity = 2 (or 2 separate entries) | totalAmount doubled |
| ORD-07 | Mix half/full portions in same order | Each priced correctly | Accurate total |
| ORD-08 | Add special instructions to item | Text saved and visible | Appears in KDS |
| ORD-09 | Order total calculation | Subtotal = sum(price × qty) | Exact match |
| ORD-10 | Create order with 0 items | Error message | Validation works |

#### Order Status Workflow (8 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| ORD-11 | New order → Status = PENDING | Appears in KDS as PENDING | Kitchen notified |
| ORD-12 | PENDING → PREPARING | Status updates, timestamp recorded | Smooth transition |
| ORD-13 | PREPARING → READY | Status updates, visible to staff | Ready for serving |
| ORD-14 | READY → SERVED | Status updates, Table = RUNNING | Auto-transition |
| ORD-15 | SERVED → Bill → COMPLETED | Status = COMPLETED, Table = AVAILABLE | Order closed |
| ORD-16 | Cannot skip status (e.g., PENDING → READY) | Must follow sequence | Validation enforced |
| ORD-17 | Order status history | Can see status change timeline | Audit trail |
| ORD-18 | Concurrent status updates (2 devices) | Optimistic locking prevents conflict | Version check works |

#### Running Table Workflow (7 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| ORD-19 | Table 5: Order 3 items → Status SERVED | Table = RUNNING | Correct transition |
| ORD-20 | Table 5 (RUNNING): Add 2 more items | Items added to SAME order, urgent alert | No new order |
| ORD-21 | Running table items marked URGENT in KDS | 🔥 URGENT badge shown | Visual distinction |
| ORD-22 | Running table plays urgent sound (3 beeps) | Sound plays | Audible alert |
| ORD-23 | Generate bill includes ALL items (original + running) | Bill shows 5 items total | Complete bill |
| ORD-24 | Running table with 3 additions over 30 mins | All tracked in same order | No data loss |
| ORD-25 | Running table → Bill → Table AVAILABLE | Workflow completes | Clean state |

---

### 1.5 Kitchen Display System (KDS) (15 cases)
**Priority**: CRITICAL  
**Goal**: Kitchen sees orders in real-time with correct alerts

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| KDS-01 | New order appears in KDS | Shows within 10 seconds | Real-time update |
| KDS-02 | New order plays sound (1 beep) | /sounds/new-order.mp3 plays | Audible notification |
| KDS-03 | Running table addition plays urgent sound (3 beeps) | /sounds/urgent.mp3 plays 3x | Distinct alert |
| KDS-04 | Sound files exist | /public/sounds/new-order.mp3, urgent.mp3 | Files present |
| KDS-05 | KDS shows order age timer | MM:SS updates every second | Accurate timing |
| KDS-06 | Order >5 mins → Yellow timer | Color changes | Visual warning |
| KDS-07 | Order >10 mins → Red timer | Color changes | Urgent warning |
| KDS-08 | Order items grouped by order | Each order card separate | Clear layout |
| KDS-09 | Special instructions visible | Text shown clearly | Kitchen can read |
| KDS-10 | HALF/FULL badges shown | Portion type clear | No confusion |
| KDS-11 | URGENT items highlighted in red | Different background color | Stands out |
| KDS-12 | KDS on Sony TV (autoStart mode) | Loads without click, sound disabled | TV-friendly |
| KDS-13 | KDS polling interval = 10s | Updates every 10 seconds | Reasonable load |
| KDS-14 | KDS handles 20 simultaneous orders | No lag, all visible | Scales well |
| KDS-15 | KDS offline → Reconnect → Shows orders | Resilient to network issues | Auto-recovery |

---

### 1.6 Billing System (20 cases)
**Priority**: CRITICAL (HIGHEST)  
**Goal**: Bills are 100% accurate - no double billing, no missing items

#### Bill Generation (12 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| BILL-01 | Generate bill for single order (3 items) | Bill shows exactly 3 items | Correct count |
| BILL-02 | Generate bill for running table (original 3 + added 2) | Bill shows exactly 5 items | All items included |
| BILL-03 | **CRITICAL**: COMPLETED orders NOT in new bill | Only PENDING/PREPARING/READY/SERVED | No double billing |
| BILL-04 | Bill calculation: Subtotal = sum(item prices) | Math correct | Exact match |
| BILL-05 | Bill calculation: GST = 18% of subtotal | Tax correct | CGST 9% + SGST 9% |
| BILL-06 | Bill calculation: Total = Subtotal + GST - Discount | Final amount correct | Accurate total |
| BILL-07 | Bill generated → All orders status = COMPLETED | Orders marked COMPLETED | State updated |
| BILL-08 | Bill generated → Table = AVAILABLE | Table freed | Immediate update |
| BILL-09 | Cannot generate bill twice for same order | Error message | Idempotency check |
| BILL-10 | Bill for READY order → Auto-marks as SERVED first | Order = SERVED, then COMPLETED | Workflow enforcement |
| BILL-11 | Bill includes cancelled items? | Only ACTIVE items | Cancelled items excluded |
| BILL-12 | Bill recalculates from items, not stale order.totalAmount | Accurate even if order.totalAmount wrong | Line 200 fix verified |

#### Discount & Points (4 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| BILL-13 | Admin applies 25% discount | Discount applied, total reduced | Works |
| BILL-14 | Staff applies 15% discount | Discount applied | Max allowed |
| BILL-15 | Staff tries 20% discount | Error: "Max 15%" | Blocked |
| BILL-16 | Redeem loyalty points (100 pts = ₹100 off) | Total reduced by ₹100 | Points deducted |

#### GST & Service Charge (4 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| BILL-17 | Toggle GST OFF | Bill generated without tax | Total = Subtotal - Discount |
| BILL-18 | Toggle GST ON | Bill includes 18% tax | CGST + SGST |
| BILL-19 | Toggle Service Charge ON | 10% service charge added | Total increases |
| BILL-20 | GST OFF + Service Charge ON | Both settings respected | Accurate calculation |

---

### 1.7 Payment & Receipt (15 cases)
**Priority**: CRITICAL  
**Goal**: Payment methods work, receipt prints correctly on 80mm thermal printer

#### Payment Methods (6 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| PAY-01 | Pay ₹500 bill with CASH | Bill = PAID, paymentMethod = CASH | Complete |
| PAY-02 | Pay ₹500 bill with CARD | Bill = PAID, paymentMethod = CARD | Complete |
| PAY-03 | Pay ₹500 bill with UPI | Bill = PAID, paymentMethod = UPI | Complete |
| PAY-04 | Split payment: ₹300 cash + ₹200 UPI | Bill = PAID, cashAmount = 300, onlineAmount = 200 | Both recorded |
| PAY-05 | Split payment: Amounts don't match total | Error: "Must match total" | Validation works |
| PAY-06 | Payment complete → Today's revenue updates | Dashboard shows new total | Real-time update |

#### Receipt Printing (9 cases)
| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| RCP-01 | Receipt prints ONCE (not twice) | Single print job | Fixed double-print bug |
| RCP-02 | Receipt width = 80mm | Full paper utilization | No wasted space |
| RCP-03 | Receipt top margin = 8mm | Logo not cut off | Safe print area |
| RCP-04 | Receipt font sizes: Header 18px, Items 14px, Total 20px | Readable on thermal printer | Professional look |
| RCP-05 | Receipt watermark: 35mm, 3% opacity | Subtle background | Not obtrusive |
| RCP-06 | Receipt header centered | Restaurant name, address, GST aligned | Clean layout |
| RCP-07 | Receipt items: 1 line per item | No wrapping, clean formatting | Easy to read |
| RCP-08 | Receipt TOTAL bold & prominent | Stands out | Clear final amount |
| RCP-09 | Receipt PAID box centered | Visual confirmation | Professional finish |

---

### 1.8 Customer Loyalty (8 cases)
**Priority**: MEDIUM  
**Goal**: Loyalty points earn and redeem correctly

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| LOY-01 | New customer phone number → Creates account | Customer record created | Auto-registration |
| LOY-02 | Returning customer phone → Loads profile | Shows visit count, points | Recognition |
| LOY-03 | ₹1000 bill → Earn 100 points | Points added to balance | 10% earning rate |
| LOY-04 | Redeem 50 points → ₹50 off bill | Total reduced, points deducted | 1:1 redemption |
| LOY-05 | Cannot redeem more points than balance | Error message | Validation works |
| LOY-06 | Points transaction history | Shows earned/redeemed records | Audit trail |
| LOY-07 | Total visits counter increments | Count increases by 1 | Accurate tracking |
| LOY-08 | Total spend accumulates | totalSpend += bill.total | Lifetime value |

---

### 1.9 Today's Revenue Popup (4 cases)
**Priority**: LOW  
**Goal**: Dashboard popup shows accurate daily revenue

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| REV-01 | Open revenue popup | Shows total + breakdown | Modal opens |
| REV-02 | Revenue breakdown by payment method | Cash/UPI/Card/Split amounts | Separate totals |
| REV-03 | Revenue updates after new payment | Total increases immediately | Real-time |
| REV-04 | Revenue resets at midnight | Next day starts at ₹0 | Date-based filter |

---

## 2. STRESS TESTING (Performance Under Load)

### 2.1 High Volume Testing
**Priority**: HIGH  
**Goal**: System handles busy restaurant peak hours

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| STR-01 | Create 50 orders simultaneously | All created successfully | No errors |
| STR-02 | 500 menu items in database | Menu loads in <2s | Acceptable speed |
| STR-03 | 20 concurrent users (staff + kitchen) | No conflicts, all actions work | Multi-user support |
| STR-04 | Generate 10 bills simultaneously | All generated correctly | Transaction safety |
| STR-05 | KDS with 30 orders on screen | No lag, timers update smoothly | UI responsive |
| STR-06 | Database: 10,000 historical orders | Queries still fast | Indexed properly |

---

## 3. EDGE CASES & RACE CONDITIONS

### 3.1 Concurrent Operations
**Priority**: CRITICAL  
**Goal**: No data corruption when multiple devices operate simultaneously

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| EDGE-01 | Two devices add items to same order simultaneously | Optimistic locking: Second gets "refresh" error | Version conflict detected |
| EDGE-02 | Device A generates bill, Device B adds items | One succeeds, other gets error | Transaction isolation |
| EDGE-03 | Two devices try to occupy same table | First succeeds, second blocked | Race condition prevented |
| EDGE-04 | Generate bill while kitchen updates order status | Bill generation succeeds with current state | Snapshot isolation |
| EDGE-05 | Network disconnect during bill generation | Transaction rolls back OR completes | No partial state |

### 3.2 User Errors
**Priority**: MEDIUM  
**Goal**: System handles mistakes gracefully

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| EDGE-06 | Add 1000 quantity of item | Error: "Max 1000" | Validation works |
| EDGE-07 | SQL injection in special instructions | Sanitized, no query executed | Security filter works |
| EDGE-08 | XSS in customer name | Escaped, no script executed | Security filter works |
| EDGE-09 | Double-click "Generate Bill" rapidly | Only 1 bill created | Debouncing works |
| EDGE-10 | Refresh page during form submission | Data saved OR form cleared | No duplicate |
| EDGE-11 | Browser back button after payment | Payment still recorded | State consistent |
| EDGE-12 | Cancel item after bill generated | Cannot cancel | Immutable after billing |

---

## 4. PERFORMANCE AUDIT (Response Time SLAs)

### 4.1 API Response Times
**Priority**: HIGH  
**Goal**: All operations feel instant to users

| Endpoint | Action | Max Response Time | Pass Criteria |
|----------|--------|-------------------|---------------|
| GET /api/orders | Dashboard load | <300ms | Feels instant |
| POST /api/orders | Create order | <500ms | Acceptable |
| POST /api/bills | Generate bill | <700ms | Includes DB writes |
| PATCH /api/orders/:id | Update status | <200ms | Quick feedback |
| GET /api/orders?status=PENDING,PREPARING | KDS load | <2000ms | 10s polling acceptable |
| Receipt print | Full workflow | <1000ms | Quick turnaround |

### 4.2 UI Performance
**Priority**: MEDIUM

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| PERF-01 | Dashboard initial load | <2s to interactive | Fast startup |
| PERF-02 | Menu grid with 50 items | Scrolls smoothly | No jank |
| PERF-03 | KDS with 20 orders | Timers update without lag | Smooth animation |
| PERF-04 | Bill calculation updates | Instant preview | Real-time |
| PERF-05 | Search menu items | Results appear instantly | Responsive |

---

## 5. SECURITY AUDIT

### 5.1 Authentication & Authorization
**Priority**: CRITICAL  
**Goal**: No unauthorized access

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| SEC-01 | Access /api/orders without login | 401 Unauthorized | Auth required |
| SEC-02 | Staff tries admin-only action | 403 Forbidden | Role check works |
| SEC-03 | Restaurant A tries to access Restaurant B's data | Empty/Error | Multi-tenant isolation |
| SEC-04 | JWT token expiration | Auto-logout after expiry | Session timeout |

### 5.2 Input Validation
**Priority**: HIGH  
**Goal**: All user input sanitized

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| SEC-05 | SQL injection in order search | Parameterized query, no injection | Safe |
| SEC-06 | XSS in special instructions | HTML escaped | Safe |
| SEC-07 | Negative quantities | Validation error | Rejected |
| SEC-08 | Extremely long input (10,000 chars) | Truncated or rejected | Length limit |

### 5.3 CSRF Protection
**Priority**: HIGH  
**Goal**: State-changing requests require valid origin

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| SEC-09 | POST from different origin | 403 CSRF error | Middleware blocks |
| SEC-10 | POST with valid origin header | Success | Allowed |
| SEC-11 | POST with no origin/referer | 403 CSRF error | Security fix works |

---

## 6. UX AUDIT (User Experience)

### 6.1 Click Counts & Efficiency
**Priority**: MEDIUM  
**Goal**: Minimize clicks for common tasks

| Task | Max Clicks | Pass Criteria |
|------|------------|---------------|
| Create order | 5 clicks | Select table → Items → Quantity → Submit |
| Generate bill | 2 clicks | Select order → Generate |
| Process payment | 3 clicks | Payment method → Confirm → Print |
| Update order status | 1 click | Status button in KDS |

### 6.2 Keyboard Shortcuts (Future Enhancement)
**Priority**: LOW

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| UX-01 | Ctrl+N → New Order | Modal opens |
| UX-02 | Ctrl+B → Generate Bill | Bill modal opens |
| UX-03 | Ctrl+P → Print | Receipt prints |

### 6.3 Touchscreen Usability
**Priority**: HIGH (for tablet use)

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| UX-04 | Menu item buttons | Large enough (44×44px min) | Easy to tap |
| UX-05 | Scroll performance on tablet | Smooth | No lag |
| UX-06 | KDS on TV screen | Readable from 2 meters | Font size adequate |

### 6.4 Loading States & Feedback
**Priority**: MEDIUM

| Test ID | Test Case | Expected Result | Pass Criteria |
|---------|-----------|-----------------|---------------|
| UX-07 | Slow API response | Loading spinner shown | User feedback |
| UX-08 | Success actions | Toast notification | Clear confirmation |
| UX-09 | Error actions | Error toast with reason | Helpful message |
| UX-10 | Empty states | Friendly message | Not blank screen |

---

## SUCCESS CRITERIA

### Launch Readiness Checklist

**CRITICAL** (Must be 100% pass):
- ✅ BILL-03: No COMPLETED orders in new bills (ZERO double billing incidents)
- ✅ RCP-01: Receipt prints only once
- ✅ ORD-19 to ORD-25: Running table workflow complete
- ✅ TBL-01 to TBL-12: Table status accuracy
- ✅ All SECURITY tests pass

**HIGH** (Must be 95%+ pass):
- ✅ All order creation & management tests
- ✅ KDS functionality tests
- ✅ Payment & receipt tests
- ✅ Performance SLAs met

**MEDIUM** (Must be 85%+ pass):
- ✅ Loyalty program tests
- ✅ Menu management tests
- ✅ UX tests

**LOW** (Nice to have):
- ✅ Keyboard shortcuts
- ✅ Advanced UX features

---

## TEST EXECUTION PLAN

### Phase 1: Critical Path (Day 1)
1. Table lifecycle (TBL-01 to TBL-12)
2. Order workflow (ORD-01 to ORD-25)
3. Bill generation - THE MOST CRITICAL (BILL-01 to BILL-12)
4. Payment & Receipt (PAY-01 to RCP-09)

**Goal**: Verify core restaurant workflow end-to-end

### Phase 2: Supporting Features (Day 2)
1. KDS testing (KDS-01 to KDS-15)
2. Menu management (MENU-01 to MENU-10)
3. Loyalty program (LOY-01 to LOY-08)
4. Authentication (AUTH-01 to AUTH-08)

**Goal**: Verify supporting systems work correctly

### Phase 3: Edge Cases & Performance (Day 3)
1. Concurrent operations (EDGE-01 to EDGE-12)
2. Stress testing (STR-01 to STR-06)
3. Performance SLAs (PERF-01 to PERF-05)
4. Security audit (SEC-01 to SEC-11)

**Goal**: Verify system is production-grade under stress

### Phase 4: UX & Final Validation (Day 4)
1. UX audit (UX-01 to UX-10)
2. Revenue dashboard (REV-01 to REV-04)
3. Full regression test (critical path again)
4. Sign-off decision

**Goal**: Polish and final go/no-go

---

## DEFECT SEVERITY LEVELS

**P0 - Blocker**: Cannot deploy to production
- Double billing
- Payment not recorded
- Data loss
- Security breach

**P1 - Critical**: Must fix before launch
- Incorrect calculations
- Status transition failures
- Performance under SLA

**P2 - High**: Should fix before launch
- UX issues
- Non-critical errors
- Minor calculation errors

**P3 - Low**: Can defer post-launch
- Cosmetic issues
- Nice-to-have features
- Minor UX improvements

---

## SIGN-OFF CRITERIA

**Production Deployment Approved When**:
1. ✅ ZERO P0 (Blocker) defects
2. ✅ ZERO P1 (Critical) defects in critical path
3. ✅ <5 P2 (High) defects (documented workarounds)
4. ✅ Performance SLAs met
5. ✅ Security audit passed
6. ✅ Manual testing by restaurant owner completed
7. ✅ Backup and rollback plan in place

**User Statement**: "Agar wo sab sahi chala, to production me deploy kar sakte ho"

---

## TESTING ENVIRONMENT

**Test Restaurant Setup**:
- 10 tables (various capacities)
- 50 menu items (VEG/NON-VEG mix, various categories)
- 2 admin users
- 3 staff users
- Test customer loyalty accounts
- Fresh database state for each phase

**Devices**:
- 2 tablets (POS terminals)
- 1 TV (KDS display - Sony)
- 1 laptop (Admin dashboard)
- 1 thermal printer (80mm)

**Network**:
- Stable WiFi (simulate disconnection for EDGE-05)
- 4G fallback

---

## METRICS TO TRACK

**During Testing**:
1. **Bug Count**: P0/P1/P2/P3
2. **Pass Rate**: % tests passed per category
3. **Performance**: Avg response times vs SLA
4. **Defect Density**: Bugs per 100 test cases
5. **Retest Rate**: How many bugs found in fixes

**Post-Deployment** (monitoring plan):
1. **Error Rate**: <0.1% API errors
2. **Response Time**: 95th percentile within SLA
3. **Uptime**: >99.9%
4. **User Complaints**: Track and triage
5. **Revenue Accuracy**: Daily reconciliation

---

## ASSUMPTIONS & CONSTRAINTS

**Assumptions**:
- Single restaurant deployment initially
- PostgreSQL database
- Next.js deployed on Vercel/similar
- 80mm thermal printer (Epson/similar)
- Indian currency (₹) and tax rates (18% GST)

**Constraints**:
- No automated test framework (manual testing)
- 4-day testing window
- Limited to 5 concurrent users (not load testing beyond stress tests)

**Out of Scope**:
- Mobile app (web-only)
- Integrations (Swiggy, Zomato)
- Multi-location management
- Inventory management beyond stock tracking
- Employee time tracking
- Advanced analytics/reporting

---

## NEXT STEPS

1. **Review & Approve**: Restaurant owner reviews this document
2. **Test Data Preparation**: Set up test restaurant environment
3. **Phase 1 Execution**: Start critical path testing
4. **Daily Standups**: Review progress, triage issues
5. **Bug Fixes**: Developer addresses P0/P1 immediately
6. **Regression**: Retest after each fix
7. **Sign-off**: Final decision after Phase 4

---

**Document Version**: 1.0  
**Created**: 2026-06-26  
**Owner**: Raghav Shah  
**Status**: Ready for Review
