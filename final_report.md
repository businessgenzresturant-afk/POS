
## Phase 10: Ghost Tables Self-Healing (Dashboard UI)
- **UI Occupancy Sync**: Modified `dashboard.tsx`, `TablesOccupiedModal.tsx`, `TableSelectModal.tsx`, and `TransferTableModal.tsx` to strictly evaluate a table's occupancy status based on whether it has an active order `(activeOrders.some(...))`, rather than trusting the raw `status` enum string from the database.
- **Ghost Tables Mitigated**: Any tables that were stuck on "OCCUPIED" in the database despite having zero active orders will now elegantly render as AVAILABLE in the UI and allow new orders to be placed, inherently fixing their broken database state upon the next order settlement.
