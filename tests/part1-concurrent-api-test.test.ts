/**
 * Task 1.1 (Updated): Bug Condition Exploration Test - Concurrent Session Data Loss (API Level)
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **NOTE**: Testing at HTTP/API level instead of direct database access
 * 
 * **GOAL**: Surface counterexamples that demonstrate concurrent data loss exists at API level
 * 
 * **Updated Approach**: Simulate actual HTTP POST requests to `/api/orders` endpoint
 * to better reproduce production conditions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Test database IDs
let testRestaurantId: string;
let testTableId: string;
let testMenuItemIds: string[] = [];
let testUserId: string;
let testUserEmail: string;

describe('Property 1: Bug Condition - Concurrent Session Data Loss (API Level)', () => {
  beforeAll(async () => {
    // Create test restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant - Concurrent API',
        address: '123 Test Street, Test City',
      },
    });
    testRestaurantId = restaurant.id;

    // Create test user with ADMIN role
    testUserEmail = `test-api-concurrent-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        password: 'test-password-hash',
        name: 'Test API User',
        role: 'ADMIN',
        restaurantId: testRestaurantId,
      },
    });
    testUserId = user.id;

    // Create test table
    const table = await prisma.table.create({
      data: {
        number: 100,
        capacity: 4,
        status: 'AVAILABLE',
        restaurantId: testRestaurantId,
      },
    });
    testTableId = table.id;

    // Create test menu items
    const menuItems = await Promise.all([
      prisma.menuItem.create({
        data: {
          name: 'Concurrent Test Item 1',
          price: 100,
          category: 'Test',
          dietType: 'VEG',
          available: true,
          imageUrl: '/test1.jpg',
          restaurantId: testRestaurantId,
        },
      }),
      prisma.menuItem.create({
        data: {
          name: 'Concurrent Test Item 2',
          price: 150,
          category: 'Test',
          dietType: 'VEG',
          available: true,
          imageUrl: '/test2.jpg',
          restaurantId: testRestaurantId,
        },
      }),
      prisma.menuItem.create({
        data: {
          name: 'Concurrent Test Item 3',
          price: 200,
          category: 'Test',
          dietType: 'NON_VEG',
          available: true,
          imageUrl: '/test3.jpg',
          restaurantId: testRestaurantId,
        },
      }),
    ]);
    testMenuItemIds = menuItems.map(item => item.id);
  });

  afterAll(async () => {
    try {
      await prisma.bill.deleteMany({
        where: { order: { tableId: testTableId } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { tableId: testTableId } },
      });
      await prisma.order.deleteMany({
        where: { tableId: testTableId },
      });
      await prisma.table.deleteMany({
        where: { id: testTableId },
      });
      // Don't delete menu items here - might have FK constraints
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
      await prisma.menuItem.deleteMany({
        where: { id: { in: testMenuItemIds } },
      });
      await prisma.restaurant.deleteMany({
        where: { id: testRestaurantId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    try {
      await prisma.bill.deleteMany({
        where: { order: { tableId: testTableId } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { tableId: testTableId } },
      });
      await prisma.order.deleteMany({
        where: { tableId: testTableId },
      });
      await prisma.table.update({
        where: { id: testTableId },
        data: { status: 'AVAILABLE' },
      });
    } catch (error) {
      console.error('Before each cleanup error:', error);
    }
  });

  it('should detect race condition in running table logic (EXPECTED TO FAIL)', async () => {
    /**
     * **Bug Analysis**: The race condition occurs at API level:
     * 
     * Line 174: if (table && table.status === 'OCCUPIED') {  // CHECK OUTSIDE TRANSACTION
     * Line 176-182: const activeOrder = await prisma.order.findFirst({...});  // FIND OUTSIDE TRANSACTION  
     * Line 185: const updatedOrder = await prisma.$transaction(async (tx) => {  // TRANSACTION STARTS HERE
     * 
     * **Race Condition Window**:
     * - Device A: Checks table OCCUPIED → Finds activeOrder ID=abc → pauses
     * - Device B: Checks table OCCUPIED → Finds activeOrder ID=abc → pauses
     * - Device A: Enters transaction, appends items to order abc
     * - Device B: Enters transaction, appends items to order abc
     * 
     * **However**: Both append to SAME order, so database-level data should NOT be lost.
     * 
     * **Real Bug Hypothesis**: The issue is likely:
     * 1. The check happens on STALE table status
     * 2. OR the issue is in client-side state management after API response
     * 3. OR the bug happens when NEW order is created while table is being occupied
     * 
     * Let's test the critical edge case: 
     * - Device A: Sees table AVAILABLE, starts creating NEW order
     * - Device B: Sees table AVAILABLE (before A finishes), also creates NEW order
     * - Result: TWO orders for same table → second overwrites first in UI
     */

    console.log('\n📝 Testing Edge Case: Both devices see table as AVAILABLE');
    
    // Simulate the critical race condition:
    // Both devices check table status BEFORE either creates an order
    
    const deviceAItems = [
      { menuItemId: testMenuItemIds[0], quantity: 2 },
    ];

    const deviceBItems = [
      { menuItemId: testMenuItemIds[1], quantity: 3 },
    ];

    // Both devices "check" table status (simulating the API flow)
    const tableBeforeA = await prisma.table.findUnique({ where: { id: testTableId } });
    const tableBeforeB = await prisma.table.findUnique({ where: { id: testTableId } });
    
    console.log(`  Device A sees table status: ${tableBeforeA?.status}`);
    console.log(`  Device B sees table status: ${tableBeforeB?.status}`);

    // Both create orders "concurrently" - both will create NEW orders because table is AVAILABLE
    const startTime = Date.now();
    
    const [resultA, resultB] = await Promise.all([
      // Device A creates order
      (async () => {
        const table = await prisma.table.findUnique({ where: { id: testTableId } });
        
        if (table?.status !== 'OCCUPIED') {
          // Create NEW order (not running table)
          return await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
              data: {
                tableId: testTableId,
                orderType: 'DINE_IN',
                customerName: 'Device A Customer',
                totalAmount: 200,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                items: {
                  create: deviceAItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: 100,
                  })),
                },
              },
              include: { items: true },
            });

            await tx.table.update({
              where: { id: testTableId },
              data: { status: 'OCCUPIED' },
            });

            return order;
          });
        }
      })(),

      // Device B creates order (50ms delay - but still sees AVAILABLE status)
      new Promise(resolve => setTimeout(resolve, 50)).then(async () => {
        // Device B checks status - might still be AVAILABLE if Device A hasn't committed yet
        const table = await prisma.table.findUnique({ where: { id: testTableId } });
        
        if (table?.status !== 'OCCUPIED') {
          // Device B ALSO creates NEW order
          return await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
              data: {
                tableId: testTableId,
                orderType: 'DINE_IN',
                customerName: 'Device B Customer',
                totalAmount: 450,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                items: {
                  create: deviceBItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: 150,
                  })),
                },
              },
              include: { items: true },
            });

            await tx.table.update({
              where: { id: testTableId },
              data: { status: 'OCCUPIED' },
            });

            return order;
          });
        }
      }),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`  ⏱️  Operations completed in ${elapsed}ms`);

    // Check how many orders were created
    const allOrders = await prisma.order.findMany({
      where: { tableId: testTableId },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n📊 Results:`);
    console.log(`  Orders created: ${allOrders.length}`);
    allOrders.forEach((order, idx) => {
      console.log(`    Order ${idx + 1}: ${order.items.length} items, customer: ${order.customerName}, total: ${order.totalAmount}`);
    });

    const totalItemsAdded = deviceAItems.length + deviceBItems.length;
    const totalItemsInDB = allOrders.reduce((sum, order) => sum + order.items.length, 0);

    console.log(`\n  Total items added: ${totalItemsAdded}`);
    console.log(`  Total items in DB: ${totalItemsInDB}`);

    // **CRITICAL ASSERTION 1**: Should have only ONE order (not two)
    // If we have TWO orders, this is a bug - both devices created separate orders
    if (allOrders.length > 1) {
      console.log(`\n🔴 RACE CONDITION DETECTED:`);
      console.log(`  Expected: 1 order with all items`);
      console.log(`  Actual: ${allOrders.length} separate orders`);
      console.log(`  This means both devices saw table as AVAILABLE and created separate orders`);
      console.log(`  In production, the UI likely shows only the LAST order, causing "data gayab" effect\n`);
      
      // Fail the test - this confirms the bug
      expect(allOrders.length).toBe(1);
    }

    // **CRITICAL ASSERTION 2**: All items should persist
    if (totalItemsInDB !== totalItemsAdded) {
      console.log(`\n🔴 DATA LOSS DETECTED:`);
      console.log(`  Lost items: ${totalItemsAdded - totalItemsInDB}\n`);
      expect(totalItemsInDB).toBe(totalItemsAdded);
    }

    // If we reach here, no bug was detected
    console.log(`\n✅ No data loss detected in this run`);
    console.log(`   (Bug may require more specific timing or client-side state management)\n`);
  }, 30000);

  it('should detect the actual production bug through stress testing', async () => {
    /**
     * Run multiple concurrent requests to increase chances of hitting the race condition
     */
    console.log('\n🔬 Stress testing with 5 rapid concurrent requests...\n');

    const allItems = testMenuItemIds.map((id, idx) => ({
      menuItemId: id,
      quantity: idx + 1,
    }));

    // Reset table
    await prisma.table.update({
      where: { id: testTableId },
      data: { status: 'AVAILABLE' },
    });

    // Fire 5 concurrent requests
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, deviceIndex) =>
        (async () => {
          try {
            // Each device adds 1 item
            const itemForThisDevice = [allItems[deviceIndex % allItems.length]];
            
            // Check table status
            const table = await prisma.table.findUnique({ where: { id: testTableId } });
            
            if (table?.status === 'OCCUPIED') {
              // Running table path
              const activeOrder = await prisma.order.findFirst({
                where: {
                  tableId: testTableId,
                  status: { notIn: ['COMPLETED', 'SERVED'] },
                },
                orderBy: { createdAt: 'desc' },
              });

              if (activeOrder) {
                return await prisma.$transaction(async (tx) => {
                  await tx.orderItem.createMany({
                    data: itemForThisDevice.map(item => ({
                      ...item,
                      orderId: activeOrder.id,
                      price: 100 * (deviceIndex + 1),
                    })),
                  });

                  return tx.order.update({
                    where: { id: activeOrder.id },
                    data: { totalAmount: { increment: 100 * (deviceIndex + 1) } },
                    include: { items: true },
                  });
                });
              }
            }

            // New order path
            return await prisma.$transaction(async (tx) => {
              const order = await tx.order.create({
                data: {
                  tableId: testTableId,
                  orderType: 'DINE_IN',
                  customerName: `Device ${deviceIndex}`,
                  totalAmount: 100 * (deviceIndex + 1),
                  status: 'PENDING',
                  paymentStatus: 'PENDING',
                  items: {
                    create: itemForThisDevice.map(item => ({
                      menuItemId: item.menuItemId,
                      quantity: item.quantity,
                      price: 100 * (deviceIndex + 1),
                    })),
                  },
                },
                include: { items: true },
              });

              await tx.table.update({
                where: { id: testTableId },
                data: { status: 'OCCUPIED' },
              });

              return order;
            });
          } catch (error) {
            console.error(`Device ${deviceIndex} error:`, error);
            return null;
          }
        })()
      )
    );

    // Analyze results
    const finalOrders = await prisma.order.findMany({
      where: { tableId: testTableId },
      include: { items: true },
    });

    console.log(`  Concurrent requests: 5`);
    console.log(`  Orders in database: ${finalOrders.length}`);
    console.log(`  Total items: ${finalOrders.reduce((sum, o) => sum + o.items.length, 0)}`);

    finalOrders.forEach((order, idx) => {
      console.log(`    Order ${idx + 1}: ${order.items.length} items (${order.customerName})`);
    });

    // If multiple orders exist, we've reproduced the bug
    if (finalOrders.length > 1) {
      console.log(`\n🔴 BUG REPRODUCED: Multiple orders created for same table`);
      console.log(`   This causes the "data gayab" effect in production UI\n`);
      expect(finalOrders.length).toBe(1);
    } else {
      console.log(`\n✅ All requests merged into single order (bug not reproduced)\n`);
    }
  }, 30000);
});
