import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt to add the column using raw SQL
    await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "kotPrinted" BOOLEAN NOT NULL DEFAULT false;`);
    
    return NextResponse.json({ success: true, message: "Database schema fixed successfully" });
  } catch (error: any) {
    console.error("Error fixing DB:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
