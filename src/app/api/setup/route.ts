import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const log: string[] = [];
  
  try {
    // Step 1: Create all ENUM types
    log.push('Creating enum types...');
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ Enum types created');

    // Step 2: Create Restaurant table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Restaurant" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
      );
    `);
    log.push('✅ Restaurant table created');

    // Step 3: Create User table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'STAFF',
        "restaurantId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ User table created');

    // Step 4: Create Table table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Table" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "number" INTEGER NOT NULL,
        "capacity" INTEGER NOT NULL,
        "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
        "restaurantId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Table_restaurantId_idx" ON "Table"("restaurantId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Table_status_idx" ON "Table"("status");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Table_restaurantId_number_key" ON "Table"("restaurantId", "number");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Table" ADD CONSTRAINT "Table_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ Table table created');

    // Step 5: Create MenuItem table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MenuItem" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "available" BOOLEAN NOT NULL DEFAULT true,
        "restaurantId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MenuItem_category_idx" ON "MenuItem"("category");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MenuItem_available_idx" ON "MenuItem"("available");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ MenuItem table created');

    // Step 6: Create Order table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "tableId" TEXT NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "customerName" TEXT,
        "customerPhone" TEXT,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_tableId_idx" ON "Order"("tableId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ Order table created');

    // Step 7: Create OrderItem table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "orderId" TEXT NOT NULL,
        "menuItemId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "specialInstructions" TEXT,
        CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ OrderItem table created');

    // Step 8: Create Bill table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Bill" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "orderId" TEXT NOT NULL,
        "tableId" TEXT NOT NULL,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "tax" DOUBLE PRECISION NOT NULL,
        "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "total" DOUBLE PRECISION NOT NULL,
        "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
        "paymentMethod" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paidAt" TIMESTAMP(3),
        CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Bill_orderId_key" ON "Bill"("orderId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bill_status_idx" ON "Bill"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Bill_createdAt_idx" ON "Bill"("createdAt");`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Bill" ADD CONSTRAINT "Bill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Bill" ADD CONSTRAINT "Bill_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    log.push('✅ Bill table created');

    // ===== SEED DATA =====
    log.push('Seeding data...');

    // Create Restaurant
    const { hash } = await import('bcryptjs');
    
    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: { id: '00000000-0000-0000-0000-000000000001', name: 'GenZ Restaurant', address: '123 Main Street, New Delhi, India 110001' }
      });
    }
    log.push('✅ Restaurant created: ' + restaurant.name);

    // Create Users
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          { name: 'Admin User', email: 'admin@genz.com', password: await hash('admin123', 10), role: 'ADMIN', restaurantId: restaurant.id },
          { name: 'Staff User', email: 'staff@genz.com', password: await hash('staff123', 10), role: 'STAFF', restaurantId: restaurant.id },
        ]
      });
      log.push('✅ Users created (admin@genz.com / admin123, staff@genz.com / staff123)');
    } else {
      log.push('⏭️ Users already exist, skipping');
    }

    // Create Tables
    const tableCount = await prisma.table.count();
    if (tableCount === 0) {
      const tableData = [];
      for (let i = 1; i <= 10; i++) {
        tableData.push({ number: i, capacity: i <= 2 ? 2 : i <= 5 ? 4 : i <= 7 ? 6 : 8, status: 'AVAILABLE' as const, restaurantId: restaurant.id });
      }
      await prisma.table.createMany({ data: tableData });
      log.push('✅ 10 Tables created');
    } else {
      log.push('⏭️ Tables already exist, skipping');
    }

    // Create sample menu items
    const menuCount = await prisma.menuItem.count();
    if (menuCount === 0) {
      const sampleMenu = [
        { name: 'Paneer Tikka', category: 'Tandoor Starters', price: 280, imageUrl: '/images/paneer-tikka.jpg', restaurantId: restaurant.id },
        { name: 'Chicken Tikka', category: 'Tandoor Starters', price: 390, imageUrl: '/images/chicken-tikka.jpg', restaurantId: restaurant.id },
        { name: 'Butter Chicken', category: 'Main Course', price: 420, imageUrl: '/images/butter-chicken.jpg', restaurantId: restaurant.id },
        { name: 'Dal Makhni', category: 'Main Course', price: 220, imageUrl: '/images/dal-makhni.jpg', restaurantId: restaurant.id },
        { name: 'Kadhai Paneer', category: 'Main Course', price: 260, imageUrl: '/images/kadhai-paneer.jpg', restaurantId: restaurant.id },
        { name: 'Shahi Paneer', category: 'Main Course', price: 260, imageUrl: '/images/shahi-paneer.jpg', restaurantId: restaurant.id },
        { name: 'Chicken Biryani', category: 'Biryani', price: 290, imageUrl: '/images/chicken-biryani.jpg', restaurantId: restaurant.id },
        { name: 'Veg Biryani', category: 'Biryani', price: 200, imageUrl: '/images/veg-biryani.jpg', restaurantId: restaurant.id },
        { name: 'Butter Naan', category: 'Bread', price: 30, imageUrl: '/images/butter-naan.jpg', restaurantId: restaurant.id },
        { name: 'Tandoori Roti', category: 'Bread', price: 12, imageUrl: '/images/tandoori-roti.jpg', restaurantId: restaurant.id },
        { name: 'Chilli Paneer', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-paneer.jpg', restaurantId: restaurant.id },
        { name: 'Chilli Chicken', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-chicken.jpg', restaurantId: restaurant.id },
        { name: 'Veg Noodle', category: 'Noodles', price: 160, imageUrl: '/images/veg-noodle.jpg', restaurantId: restaurant.id },
        { name: 'Chicken Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-noodle.jpg', restaurantId: restaurant.id },
        { name: 'Veg Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/veg-fried-rice.jpg', restaurantId: restaurant.id },
        { name: 'Classic Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/classic-mojito.jpg', restaurantId: restaurant.id },
        { name: 'Cold Coffee', category: 'Shakes', price: 80, imageUrl: '/images/cold-coffee-shake.jpg', restaurantId: restaurant.id },
        { name: 'Veg Steam Momo', category: 'Momos', price: 80, imageUrl: '/images/veg-steam-momo.jpg', restaurantId: restaurant.id },
        { name: 'Chicken Steam Momo', category: 'Momos', price: 100, imageUrl: '/images/chicken-steam-momo.jpg', restaurantId: restaurant.id },
        { name: 'Tea', category: 'Beverages', price: 50, imageUrl: '/images/tea.jpg', restaurantId: restaurant.id },
      ];
      await prisma.menuItem.createMany({ data: sampleMenu });
      log.push('✅ 20 Menu items created');
    } else {
      log.push('⏭️ Menu items already exist, skipping');
    }

    // Final counts
    const finalCounts = {
      users: await prisma.user.count(),
      restaurants: await prisma.restaurant.count(),
      tables: await prisma.table.count(),
      menuItems: await prisma.menuItem.count(),
    };

    return NextResponse.json({
      status: 'SUCCESS',
      message: '🎉 Database setup complete! You can now login with admin@genz.com / admin123',
      log,
      counts: finalCounts,
    });

  } catch (error: any) {
    log.push(`❌ FAILED: ${error.message}`);
    return NextResponse.json({ status: 'FAILED', log, error: error.message }, { status: 500 });
  }
}
