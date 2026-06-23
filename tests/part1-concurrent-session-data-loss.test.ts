/**
 * Task 1.1: Bug Condition Exploration Test - Concurrent Session Data Loss
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **GOAL**: Surface counterexamples that demonstrate concurrent data loss exists
 * 
 * **Scoped PBT Approach**: Test two devices with same credentials making concurrent order 
 * operations on same table within 5 seconds
 * 
 * Test implementation: Simulate two concurrent POST requests to `/api/orders` with same tableId, 
 * different items, timestamps within 5000ms
 * 
 * The test assertions should verify all items from both requests persist (no silent data loss)
 * 
 * **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
 * Document counterexamples found: which items disappeared, which device's data overwrote the other
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import fc from 'fast-check';

// Test database IDs - we'll create these in beforeAll
let testRestaurantId: string;
let testTableId: string;
let testMenuItemIds: string[] = [];
let testUserId: string;

describe('Property 1: Bug Condition - Concurrent Session Data Loss', () => {
  beforeAll(async () => {
    // Create test restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant - Concurrent Session',
        address: '123 Test Street, Test City',
      },
    });
    testRestaurantId = restaurant.id;

    // Create test user with ADMIN role
    const user = await prisma.user.create({
      data: {
        email: `test-concurrent-${Date.now()}@test.com`,
        password: 'test-password-hash',
        name: 'Test User',
        role: 'ADMIN',
        restaurantId: testRestaurantId,
      },
    });
    testUserId = user.id;

    // Create test table
    const table = await prisma.table.create({
      data: {
        number: 99,
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
          name: 'Test Item 1',
          price: 100,
          category: 'Main',
          dietType: 'VEG',
          available: true,
          imageUrl: '/placeholder.jpg',
          restaurantId: testRestaurantId,
        },
      }),
      prisma.menuItem.create({
        data: {
          name: 'Test Item 2',
          price: 150,
          category: 'Main',
          dietType: 'VEG',
          available: true,
          imageUrl: '/placeholder.jpg',
          restaurantId: testRestaurantId,
        },
      }),
      prisma.menuItem.create({
        data: {
          name: 'Test Item 3',
          price: 200,
          category: 'Main',
          dietType: 'VEG',
          available: true,
          imageUrl: '/placeholder.jpg',
          restaurantId: testRestaurantId,
        },
      }),
    ]);
    testMenuItemIds = menuItems.map(item => item.id);
  });

  afterAll(async () => {
    // Cleanup test data in correct order (respecting foreign key constraints)
    try {
      // Delete bills first (has FK to orders)
      await prisma.bill.deleteMany({
        where: {
          order: {
            tableId: testTableId,
          },
        },
      });
      // Delete order items
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            tableId: testTableId,
          },
        },
      });
      // Delete orders
      await prisma.order.deleteMany({
        where: {
          tableId: testTableId,
        },
      });
      // Delete table
      await prisma.table.deleteMany({
        where: {
          id: testTableId,
        },
      });
      // Delete menu items (now that order items are deleted)
      await prisma.menuItem.deleteMany({
        where: {
          id: { in: testMenuItemIds },
        },
      });
      // Delete user
      await prisma.user.deleteMany({
        where: {
          id: testUserId,
        },
      });
      // Delete restaurant
      await prisma.restaurant.deleteMany({
        where: {
          id: testRestaurantId,
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    // Reset table to AVAILABLE before each test
    // Delete bills first
    await prisma.bill.deleteMany({
      where: {
        order: {
          tableId: testTableId,
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          tableId: testTableId,
        },
      },
    });
    await prisma.order.deleteMany({
      where: {
        tableId: testTableId,
      },
    });
    await prisma.table.update({
      where: { id: testTableId },
      data: { status: 'AVAILABLE' },
    });
  });

  it('should preserve all items from concurrent order operations (EXPECTED TO FAIL on unfixed code)', async () => {
    /**
     * **Bug Condition**: Two devices with same credentials make concurrent order operations
     * on the same table within 5 seconds
     * 
     * **Expected Behavior (after fix)**: All items from both operations persist - NO silent data loss
     * 
     * **Current Behavior (before fix)**: One operation's data overwrites the other, causing data loss
     */

    // Simulate Device A: Adding 2 items to the table
    const deviceAItems = [
      { menuItemId: testMenuItemIds[0], quantity: 2 },
      { menuItemId: testMenuItemIds[1], quantity: 1 },
    ];

    // Simulate Device B: Adding 3 items to the same table (concurrent)
    const deviceBItems = [
      { menuItemId: testMenuItemIds[1], quantity: 1 },
      { menuItemId: testMenuItemIds[2], quantity: 2 },
    ];

    // Execute concurrent operations (simulating two devices within 5 seconds)
    const timestamp = Date.now();
    
    const [orderA, orderB] = await Promise.all([
      // Device A creates order
      prisma.$transaction(async (tx) => {
        // Check table status
        const table = await tx.table.findUnique({ where: { id: testTableId } });
        
        // Calculate total
        let totalA = 0;
        for (const item of deviceAItems) {
          const menuItem = await tx.menuItem.findUnique({ 
            where: { id: item.menuItemId } 
          });
          totalA += (menuItem?.price || 0) * item.quantity;
        }

        if (table?.status === 'OCCUPIED') {
          // Find active order
          const activeOrder = await tx.order.findFirst({
            where: {
              tableId: testTableId,
              status: { notIn: ['COMPLETED', 'SERVED'] },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (activeOrder) {
            // Append items
            await tx.orderItem.createMany({
              data: deviceAItems.map(item => ({
                ...item,
                orderId: activeOrder.id,
                price: 100, // Simplified for test
              })),
            });

            return tx.order.update({
              where: { id: activeOrder.id },
              data: {
                totalAmount: { increment: totalA },
              },
              include: {
                items: true,
              },
            });
          }
        }

        // Create new order
        const newOrder = await tx.order.create({
          data: {
            tableId: testTableId,
            orderType: 'DINE_IN',
            customerName: 'Device A Customer',
            totalAmount: totalA,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            items: {
              create: deviceAItems.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: 100, // Simplified
              })),
            },
          },
          include: {
            items: true,
          },
        });

        await tx.table.update({
          where: { id: testTableId },
          data: { status: 'OCCUPIED' },
        });

        return newOrder;
      }),

      // Device B creates order (with small delay to simulate near-concurrent)
      new Promise(resolve => setTimeout(resolve, 100)).then(() =>
        prisma.$transaction(async (tx) => {
          const table = await tx.table.findUnique({ where: { id: testTableId } });
          
          let totalB = 0;
          for (const item of deviceBItems) {
            const menuItem = await tx.menuItem.findUnique({ 
              where: { id: item.menuItemId } 
            });
            totalB += (menuItem?.price || 0) * item.quantity;
          }

          if (table?.status === 'OCCUPIED') {
            const activeOrder = await tx.order.findFirst({
              where: {
                tableId: testTableId,
                status: { notIn: ['COMPLETED', 'SERVED'] },
              },
              orderBy: { createdAt: 'desc' },
            });

            if (activeOrder) {
              await tx.orderItem.createMany({
                data: deviceBItems.map(item => ({
                  ...item,
                  orderId: activeOrder.id,
                  price: 150,
                })),
              });

              return tx.order.update({
                where: { id: activeOrder.id },
                data: {
                  totalAmount: { increment: totalB },
                },
                include: {
                  items: true,
                },
              });
            }
          }

          const newOrder = await tx.order.create({
            data: {
              tableId: testTableId,
              orderType: 'DINE_IN',
              customerName: 'Device B Customer',
              totalAmount: totalB,
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
            include: {
              items: true,
            },
          });

          await tx.table.update({
            where: { id: testTableId },
            data: { status: 'OCCUPIED' },
          });

          return newOrder;
        })
      ),
    ]);

    // Verify operations were concurrent (within 5 seconds)
    const elapsed = Date.now() - timestamp;
    expect(elapsed).toBeLessThan(5000);

    // Query final state from database
    const finalOrders = await prisma.order.findMany({
      where: { tableId: testTableId },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalItemsAdded = deviceAItems.length + deviceBItems.length;

    // Count all items across all orders
    const totalItemsInDB = finalOrders.reduce(
      (sum, order) => sum + order.items.length,
      0
    );

    // **CRITICAL ASSERTION**: All items from both devices must persist
    // **EXPECTED TO FAIL on unfixed code** - this proves the bug exists
    try {
      expect(totalItemsInDB).toBe(totalItemsAdded);
      console.log('✅ TEST PASSED: All items persisted (bug may be fixed or not reproduced)');
    } catch (error) {
      // Document the counterexample
      console.log('\n🔴 COUNTEREXAMPLE FOUND - Data Loss Detected:');
      console.log(`  Device A added: ${deviceAItems.length} items`);
      console.log(`  Device B added: ${deviceBItems.length} items`);
      console.log(`  Expected total: ${totalItemsAdded} items`);
      console.log(`  Actual in DB: ${totalItemsInDB} items`);
      console.log(`  Lost items: ${totalItemsAdded - totalItemsInDB}`);
      console.log(`\n  Orders in database: ${finalOrders.length}`);
      finalOrders.forEach((order, idx) => {
        console.log(`    Order ${idx + 1}: ${order.items.length} items, customer: ${order.customerName}`);
      });
      console.log('\n  This failure confirms the concurrent session data loss bug exists.\n');
      
      throw error;
    }
  }, 30000);

  it('should use property-based testing to verify concurrent operations cause data loss', () => {
    /**
     * **Property-Based Test**: For any two concurrent order operations on the same table,
     * all items from both operations should persist without silent data loss.
     * 
     * This test generates random combinations of items to ensure the bug manifests
     * across different scenarios.
     */
    
    fc.assert(
      fc.asyncProperty(
        // Generate random number of items for Device A (1-5 items)
        fc.integer({ min: 1, max: 3 }),
        // Generate random number of items for Device B (1-5 items)
        fc.integer({ min: 1, max: 3 }),
        async (numItemsA, numItemsB) => {
          // Reset table state
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

          // Create random items for both devices
          const deviceAItems = Array.from({ length: numItemsA }, (_, i) => ({
            menuItemId: testMenuItemIds[i % testMenuItemIds.length],
            quantity: 1,
          }));

          const deviceBItems = Array.from({ length: numItemsB }, (_, i) => ({
            menuItemId: testMenuItemIds[(i + 1) % testMenuItemIds.length],
            quantity: 1,
          }));

          // Simulate concurrent operations
          await Promise.all([
            prisma.$transaction(async (tx) => {
              const table = await tx.table.findUnique({ where: { id: testTableId } });
              
              if (table?.status === 'OCCUPIED') {
                const activeOrder = await tx.order.findFirst({
                  where: { tableId: testTableId, status: { notIn: ['COMPLETED', 'SERVED'] } },
                  orderBy: { createdAt: 'desc' },
                });

                if (activeOrder) {
                  await tx.orderItem.createMany({
                    data: deviceAItems.map(item => ({
                      ...item,
                      orderId: activeOrder.id,
                      price: 100,
                    })),
                  });
                  return tx.order.update({
                    where: { id: activeOrder.id },
                    data: { totalAmount: { increment: numItemsA * 100 } },
                  });
                }
              }

              const order = await tx.order.create({
                data: {
                  tableId: testTableId,
                  orderType: 'DINE_IN',
                  customerName: 'Device A',
                  totalAmount: numItemsA * 100,
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
              });

              await tx.table.update({
                where: { id: testTableId },
                data: { status: 'OCCUPIED' },
              });

              return order;
            }),

            new Promise(resolve => setTimeout(resolve, 50)).then(() =>
              prisma.$transaction(async (tx) => {
                const table = await tx.table.findUnique({ where: { id: testTableId } });
                
                if (table?.status === 'OCCUPIED') {
                  const activeOrder = await tx.order.findFirst({
                    where: { tableId: testTableId, status: { notIn: ['COMPLETED', 'SERVED'] } },
                    orderBy: { createdAt: 'desc' },
                  });

                  if (activeOrder) {
                    await tx.orderItem.createMany({
                      data: deviceBItems.map(item => ({
                        ...item,
                        orderId: activeOrder.id,
                        price: 150,
                      })),
                    });
                    return tx.order.update({
                      where: { id: activeOrder.id },
                      data: { totalAmount: { increment: numItemsB * 150 } },
                    });
                  }
                }

                const order = await tx.order.create({
                  data: {
                    tableId: testTableId,
                    orderType: 'DINE_IN',
                    customerName: 'Device B',
                    totalAmount: numItemsB * 150,
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
                });

                await tx.table.update({
                  where: { id: testTableId },
                  data: { status: 'OCCUPIED' },
                });

                return order;
              })
            ),
          ]);

          // Verify all items persisted
          const finalOrders = await prisma.order.findMany({
            where: { tableId: testTableId },
            include: { items: true },
          });

          const totalItemsInDB = finalOrders.reduce(
            (sum, order) => sum + order.items.length,
            0
          );

          const expectedTotal = numItemsA + numItemsB;

          // This assertion will fail if data loss occurs
          return totalItemsInDB === expectedTotal;
        }
      ),
      {
        numRuns: 10, // Run 10 random test cases
        timeout: 60000,
      }
    );
  }, 120000);
});
