# Account Credentials

## ADMIN Account (Full Access)
- **Email**: business.genzresturant@gmail.com
- **Password**: Admin@GenZ2024
- **Role**: ADMIN
- **Permissions**: Full access to all features (menu editing, settings, staff management, orders, bills, reports)

## STAFF Account (Operational Access Only)
- **Email**: staff@genz.com
- **Password**: StaffPos@2024
- **Role**: STAFF
- **Permissions**: 
  - ✅ Take orders
  - ✅ Send to kitchen
  - ✅ Generate bills
  - ✅ Collect payments
  - ✅ Mark items out of stock
  - ✅ Use KDS (Kitchen Display System)
  - ✅ Transfer tables
  - ❌ Edit/add/delete menu items
  - ❌ Change prices
  - ❌ Change restaurant settings
  - ❌ Manage staff accounts
  - ❌ Toggle service charge settings

## Security Notes
- Passwords are hashed using bcrypt (10 rounds)
- STAFF accounts are restricted at API level (403 Forbidden for admin-only endpoints)
- Each device should use separate account to avoid concurrent session conflicts
- Change passwords after first login in production

## Created Date
2024-06-23
