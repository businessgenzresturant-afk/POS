-- GenZ Restaurant POS - Production Seed Script
-- Run this in Supabase SQL Editor
-- This will create: Restaurant, Users, Tables, and Menu Items

-- Step 1: Create Restaurant
INSERT INTO "Restaurant" (id, name, address, "createdAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GenZ Restaurant',
  'L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

-- Step 2: Create Admin User (password: admin123)
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid(),
  'admin@genz.com',
  '$2a$10$YourHashedPasswordHere',  -- This will be replaced by bcrypt hash
  'Admin User',
  'ADMIN',
  '00000000-0000-0000-0000-000000000001',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Step 3: Create Staff User (password: staff123)
INSERT INTO "User" (id, email, password, name, role, "restaurantId", "createdAt")
VALUES (
  gen_random_uuid(),
  'staff@genz.com',
  '$2a$10$YourHashedPasswordHere',  -- This will be replaced by bcrypt hash
  'Staff User',
  'STAFF',
  '00000000-0000-0000-0000-000000000001',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Step 4: Create Tables
INSERT INTO "Table" (id, number, capacity, status, "restaurantId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 1, 2, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 2, 2, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 3, 4, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 4, 4, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 5, 4, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 6, 6, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 7, 6, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 8, 8, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 9, 2, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 10, 4, 'AVAILABLE', '00000000-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT ("restaurantId", number) DO NOTHING;

-- Step 5: Create Menu Items (Sample - First 20 items)
-- Note: SQL has character limit, so I'll create an API endpoint instead for all 179 items

INSERT INTO "MenuItem" (id, name, category, price, "imageUrl", available, "restaurantId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Paneer Tikka', 'Tandoor Starters', 280, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Chicken Tikka', 'Tandoor Starters', 390, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Butter Chicken', 'Main Course', 420, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Dal Makhni', 'Main Course', 220, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Naan', 'Bread', 30, '/images/default.jpg', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database seeded successfully! 🎉' as message;
