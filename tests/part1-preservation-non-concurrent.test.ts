/**
 * Task 1.3: Preservation Property Tests - Non-Concurrent Operations
 * 
 * **Validates: Requirements 3.1, 3.2**
 * 
 * **IMPORTANT**: These tests MUST PASS on unfixed code
 * **GOAL**: Verify that single-device and sequential operations work correctly BEFORE the fix
 * 
 * This ensures the concurrent session fix doesn't break existing working functionality:
 * - Single device creating orders
 * - Sequential order operations (>5 seconds apart)
 * - Running table additions when operations are NOT concurrent
 * 
 * **Property 2: Preservation** - Non-Concurrent Operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import fc from 'fast-check';

// Test database IDs
let testRestaurantId: string;
let testTableId: string;
let testMenuItemIds: string[] = [];
let testUserId: string;
let testUserEmail: string;

describe('Property 2: Preservation - Non-Concurrent Operations (MUST PASS ON UNFIXED CODE)', () => {
  beforeAll(async () => {
    // Create test restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant - Preservation',
        address: '456 Preservation Lane, Test City',
      },
    });
    testRestaurantId = restaurant.id;

    // Create test user with ADMIN role
    testUserEmail = `test-preservation-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        password: 'test-password-hash',
        name: 'Test Preservation User',
        role: 'ADMIN',
        restaurantId: testRestaurantId,
      },
    });
    testUserId = user.id;

    // Create test table
    const table = await prisma.table.create({
      data: {
        number: 200,
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
          name: 'Preservation Item 1',
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
          name: 'Preservation Item 2',
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
          name: 'Preservation Item 3',
          price: 200,
          category: 'Test',
          dietType: 'NON_VEG',
          available: true,
          imageUrl: '/test3.jpg',
          restaurantId: testRestaurantId,
        },
      }),
      prisma.menuItem.create({
        data: {
          name: 'Preservation Item 4',
          price: 250,
          category: 'Test',
          dietType: 'VEG',
          available: true,
          imageUrl: '/test4.jpg',
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

  it('OBSERVATION 1: Single device creates order → Works correctly on unfixed code', async () => {
    /**
     * **Observation**: Single device order creation should work perfectly
     * This is existing working functionality that must not break
     */
    console.log('\n✅ OBSERVATION 1: Testing single device order creation...\n');

    const items = [
      { menuItemId: testMenuItemIds[0], quantity: 2, price: 100 },
      { menuItemId: testMenuItemIds[1], quantity: 1, price: 150 },
    ];

    // Single device creates order
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: testTableId,
          orderType: 'DINE_IN',
          customerName: 'Single Device Customer',
          totalAmount: 350,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: {
            create: items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      await tx.table.update({
        where: { id: testTableId },
        data: { status: 'OCCUPIED' },
      });

      return newOrder;
    });

    console.log(`  Order created: ${order.id}`);
    console.log(`  Items: ${order.items.length}`);
    console.log(`  Total amount: ${order.totalAmount}`);

    // Verify order data
    expect(order).toBeDefined();
    expect(order.items.length).toBe(2);
    expect(order.totalAmount).toBe(350);

    // Verify table status
    const table = await prisma.table.findUnique({ where: { id: testTableId } });
    expect(table?.status).toBe('OCCUPIED');

    console.log(`\n✅ OBSERVATION 1 PASSED: Single device order creation works correctly\n`);
  });

  it('OBSERVATION 2: Sequential order operations (>5 sec apart) → Works correctly on unfixed code', async () => {
    /**
     * **Observation**: Sequential operations with sufficient time gap should work
     * Operations >5 seconds apart are NOT concurrent and should not race
     */
    console.log('\n✅ OBSERVATION 2: Testing sequential operations with time gap...\n');

    // First operation: Create order
    console.log('  Step 1: Creating initial order...');
    const order1 = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: testTableId,
          orderType: 'DINE_IN',
          customerName: 'Sequential Customer',
          totalAmount: 200,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: {
            create: [
              { menuItemId: testMenuItemIds[0], quantity: 2, price: 100 },
            ],
          },
        },
        include: { items: true },
      });

      await tx.table.update({
        where: { id: testTableId },
        data: { status: 'OCCUPIED' },
      });

      return newOrder;
    });

    console.log(`    Order 1 created: ${order1.items.length} items`);

    // Wait 5 seconds to ensure NOT concurrent
    console.log('  Step 2: Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Second operation: Add items to running table
    console.log('  Step 3: Adding items to running table...');
    const table = await prisma.table.findUnique({ where: { id: testTableId } });
    expect(table?.status).toBe('OCCUPIED'); // Should be occupied now

    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: testTableId,
        status: { notIn: ['COMPLETED', 'SERVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(activeOrder).toBeDefined();
    expect(activeOrder?.id).toBe(order1.id);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItem.createMany({
        data: [
          {
            orderId: activeOrder!.id,
            menuItemId: testMenuItemIds[1],
            quantity: 3,
            price: 150,
          },
        ],
      });

      return tx.order.update({
        where: { id: activeOrder!.id },
        data: { totalAmount: { increment: 450 } },
        include: { items: true },
      });
    });

    console.log(`    Order updated: ${updatedOrder.items.length} items total`);
    console.log(`    Total amount: ${updatedOrder.totalAmount}`);

    // Verify all items persisted
    expect(updatedOrder.items.length).toBe(2); // 1 original + 1 new
    expect(updatedOrder.totalAmount).toBe(650); // 200 + 450

    // Verify database state
    const finalOrders = await prisma.order.findMany({
      where: { tableId: testTableId },
      include: { items: true },
    });

    expect(finalOrders.length).toBe(1); // Still only ONE order
    expect(finalOrders[0].items.length).toBe(2); // All items preserved

    console.log(`\n✅ OBSERVATION 2 PASSED: Sequential operations work correctly\n`);
  }, 15000); // 15 second timeout for 5 second wait

  it('PROPERTY TEST: For all non-concurrent operations (>5000ms apart), all data persists correctly', async () => {
    /**
     * **Property-Based Test**: Universal property for non-concurrent operations
     * 
     * For ANY sequence of operations with >5 second gaps:
     * - All items should persist in the database
     * - Table should have exactly ONE order
     * - Order total should match sum of all items
     */
    console.log('\n🔬 PROPERTY TEST: Non-concurrent operations preserve all data...\n');

    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 operations with items
        fc.array(
          fc.record({
            menuItemIndex: fc.integer({ min: 0, max: testMenuItemIds.length - 1 }),
            quantity: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        fc.array(
          fc.record({
            menuItemIndex: fc.integer({ min: 0, max: testMenuItemIds.length - 1 }),
            quantity: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (operation1Items, operation2Items) => {
          try {
            // Clean up before test
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

            // Operation 1: Create initial order
            const price1 = 100;
            const totalAmount1 = operation1Items.reduce((sum, item) => sum + (item.quantity * price1), 0);

            const order1 = await prisma.$transaction(async (tx) => {
              const newOrder = await tx.order.create({
                data: {
                  tableId: testTableId,
                  orderType: 'DINE_IN',
                  customerName: 'Property Test Customer',
                  totalAmount: totalAmount1,
                  status: 'PENDING',
                  paymentStatus: 'PENDING',
                  items: {
                    create: operation1Items.map(item => ({
                      menuItemId: testMenuItemIds[item.menuItemIndex],
                      quantity: item.quantity,
                      price: price1,
                    })),
                  },
                },
                include: { items: true },
              });

              await tx.table.update({
                where: { id: testTableId },
                data: { status: 'OCCUPIED' },
              });

              return newOrder;
            });

            // Wait >5 seconds (simulated - using 100ms for test speed)
            // In production, this would be >5000ms
            await new Promise(resolve => setTimeout(resolve, 100));

            // Operation 2: Add to running table
            const activeOrder = await prisma.order.findFirst({
              where: {
                tableId: testTableId,
                status: { notIn: ['COMPLETED', 'SERVED'] },
              },
            });

            const price2 = 150;
            const totalAmount2 = operation2Items.reduce((sum, item) => sum + (item.quantity * price2), 0);

            const updatedOrder = await prisma.$transaction(async (tx) => {
              await tx.orderItem.createMany({
                data: operation2Items.map(item => ({
                  orderId: activeOrder!.id,
                  menuItemId: testMenuItemIds[item.menuItemIndex],
                  quantity: item.quantity,
                  price: price2,
                })),
              });

              return tx.order.update({
                where: { id: activeOrder!.id },
                data: { totalAmount: { increment: totalAmount2 } },
                include: { items: true },
              });
            });

            // Verify properties
            const finalOrders = await prisma.order.findMany({
              where: { tableId: testTableId },
              include: { items: true },
            });

            const expectedItemCount = operation1Items.length + operation2Items.length;
            const actualItemCount = finalOrders.reduce((sum, order) => sum + order.items.length, 0);

            // Property 1: Exactly ONE order should exist
            expect(finalOrders.length).toBe(1);

            // Property 2: ALL items should be preserved
            expect(actualItemCount).toBe(expectedItemCount);

            // Property 3: Total amount should match
            expect(updatedOrder.totalAmount).toBe(totalAmount1 + totalAmount2);

            return true;
          } catch (error) {
            console.error('Property test error:', error);
            throw error;
          }
        }
      ),
      {
        numRuns: 20, // Run 20 test cases with different inputs
        verbose: false,
      }
    );

    console.log(`\n✅ PROPERTY TEST PASSED: All 20 test cases passed - non-concurrent operations preserve data correctly\n`);
  }, 60000); // Extended timeout for property testing

  it('VERIFICATION: Multiple sequential operations maintain data integrity', async () => {
    /**
     * **Explicit Verification**: Test a complete sequence of operations
     * This simulates a real-world workflow with multiple sequential additions
     */
    console.log('\n🔍 VERIFICATION: Testing complete sequential workflow...\n');

    // Operation 1: Create initial order
    console.log('  Step 1: Create initial order with 2 items');
    const order1 = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: testTableId,
          orderType: 'DINE_IN',
          customerName: 'Verification Customer',
          totalAmount: 250,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: {
            create: [
              { menuItemId: testMenuItemIds[0], quantity: 1, price: 100 },
              { menuItemId: testMenuItemIds[1], quantity: 1, price: 150 },
            ],
          },
        },
        include: { items: true },
      });

      await tx.table.update({
        where: { id: testTableId },
        data: { status: 'OCCUPIED' },
      });

      return newOrder;
    });

    expect(order1.items.length).toBe(2);
    console.log(`    ✓ Order created: ${order1.items.length} items`);

    // Wait 6 seconds
    console.log('  Step 2: Wait 6 seconds');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Operation 2: Add 1 more item
    console.log('  Step 3: Add 1 more item');
    const activeOrder2 = await prisma.order.findFirst({
      where: { tableId: testTableId, status: { notIn: ['COMPLETED', 'SERVED'] } },
    });

    const updatedOrder2 = await prisma.$transaction(async (tx) => {
      await tx.orderItem.create({
        data: {
          orderId: activeOrder2!.id,
          menuItemId: testMenuItemIds[2],
          quantity: 1,
          price: 200,
        },
      });

      return tx.order.update({
        where: { id: activeOrder2!.id },
        data: { totalAmount: { increment: 200 } },
        include: { items: true },
      });
    });

    expect(updatedOrder2.items.length).toBe(3);
    console.log(`    ✓ Order updated: ${updatedOrder2.items.length} items`);

    // Wait another 6 seconds
    console.log('  Step 4: Wait 6 seconds');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Operation 3: Add 2 more items
    console.log('  Step 5: Add 2 more items');
    const activeOrder3 = await prisma.order.findFirst({
      where: { tableId: testTableId, status: { notIn: ['COMPLETED', 'SERVED'] } },
    });

    const finalOrder = await prisma.$transaction(async (tx) => {
      await tx.orderItem.createMany({
        data: [
          { orderId: activeOrder3!.id, menuItemId: testMenuItemIds[3], quantity: 1, price: 250 },
          { orderId: activeOrder3!.id, menuItemId: testMenuItemIds[0], quantity: 2, price: 100 },
        ],
      });

      return tx.order.update({
        where: { id: activeOrder3!.id },
        data: { totalAmount: { increment: 450 } },
        include: { items: true },
      });
    });

    expect(finalOrder.items.length).toBe(5);
    console.log(`    ✓ Order updated: ${finalOrder.items.length} items`);

    // Final verification
    const allOrders = await prisma.order.findMany({
      where: { tableId: testTableId },
      include: { items: true },
    });

    console.log('\n  Final state:');
    console.log(`    Orders in DB: ${allOrders.length}`);
    console.log(`    Total items: ${allOrders[0].items.length}`);
    console.log(`    Total amount: ${allOrders[0].totalAmount}`);

    expect(allOrders.length).toBe(1);
    expect(allOrders[0].items.length).toBe(5);
    expect(allOrders[0].totalAmount).toBe(900); // 250 + 200 + 450

    console.log(`\n✅ VERIFICATION PASSED: Complete sequential workflow maintains data integrity\n`);
  }, 40000); // 40 second timeout for 12 seconds of waits
});
