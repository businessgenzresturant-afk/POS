import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ONE-TIME MIGRATION ENDPOINT — applies the settings columns to production DB
// Protected by a secret token. Must be removed after running.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Simple auth: require a secret header
  const secret = request.headers.get('x-migration-secret');
  if (secret !== 'genz-migrate-settings-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Add missing columns to Restaurant table (idempotent with IF NOT EXISTS)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Restaurant"
        ADD COLUMN IF NOT EXISTS "phone" TEXT,
        ADD COLUMN IF NOT EXISTS "gstNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
        ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR',
        ADD COLUMN IF NOT EXISTS "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
        ADD COLUMN IF NOT EXISTS "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "enableDelivery" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 300,
        ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0
    `);

    // Verify the columns exist
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Restaurant' 
        AND column_name IN ('phone', 'gstNumber', 'taxRate', 'currency', 'timeZone', 'serviceChargeRate', 'enableDelivery', 'minOrderAmount', 'deliveryCharge')
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully',
      columnsVerified: result.map((r: any) => r.column_name),
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      detail: error?.message 
    }, { status: 500 });
  }
}
