-- Create unique partial index to prevent multiple active orders per table
-- This ensures at database level that only ONE order can be active per table at a time
CREATE UNIQUE INDEX "unique_active_order_per_table" 
ON "Order" ("tableId") 
WHERE "status" NOT IN ('COMPLETED', 'SERVED') AND "tableId" IS NOT NULL;
