import { prisma } from './prisma';

const menuItems = [
  // TANDOOR STARTERS (20 items)
  { name: 'Chicken Tikka', category: 'Tandoor Starters', price: 220 },
  { name: 'Chicken Malai Tikka', category: 'Tandoor Starters', price: 240 },
  { name: 'Chicken Hariyali Tikka', category: 'Tandoor Starters', price: 240 },
  { name: 'Chicken Tandoori', category: 'Tandoor Starters', price: 260 },
  { name: 'Chicken Kali Mirch', category: 'Tandoor Starters', price: 250 },
  { name: 'Paneer Tikka', category: 'Tandoor Starters', price: 180 },
  { name: 'Paneer Malai Tikka', category: 'Tandoor Starters', price: 200 },
  { name: 'Paneer Hariyali Tikka', category: 'Tandoor Starters', price: 200 },
  { name: 'Soya Chaap Tikka', category: 'Tandoor Starters', price: 160 },
  { name: 'Soya Chaap Malai Tikka', category: 'Tandoor Starters', price: 180 },
  { name: 'Mushroom Tikka', category: 'Tandoor Starters', price: 170 },
  { name: 'Tandoori Gobi', category: 'Tandoor Starters', price: 140 },
  { name: 'Fish Tikka', category: 'Tandoor Starters', price: 280 },
  { name: 'Mutton Seekh Kebab', category: 'Tandoor Starters', price: 320 },
  { name: 'Chicken Seekh Kebab', category: 'Tandoor Starters', price: 240 },
  { name: 'Ajwani Chicken Tikka', category: 'Tandoor Starters', price: 250 },
  { name: 'Achari Chicken Tikka', category: 'Tandoor Starters', price: 250 },
  { name: 'Tandoori Jhinga', category: 'Tandoor Starters', price: 350 },
  { name: 'Paneer Keema', category: 'Tandoor Starters', price: 190 },
  { name: 'Mixed Grill Platter', category: 'Tandoor Starters', price: 380 },

  // CHINESE STARTERS (14 items)
  { name: 'Veg Chilli Potato', category: 'Chinese Starters', price: 140 },
  { name: 'Paneer Chilli', category: 'Chinese Starters', price: 180 },
  { name: 'Chicken Chilli', category: 'Chinese Starters', price: 220 },
  { name: 'Veg Manchurian Dry', category: 'Chinese Starters', price: 160 },
  { name: 'Chicken Manchurian Dry', category: 'Chinese Starters', price: 220 },
  { name: 'Spring Rolls Veg', category: 'Chinese Starters', price: 150 },
  { name: 'Spring Rolls Chicken', category: 'Chinese Starters', price: 180 },
  { name: 'Crispy Honey Chilli Potato', category: 'Chinese Starters', price: 160 },
  { name: 'Crispy Paneer Dry', category: 'Chinese Starters', price: 190 },
  { name: 'Crispy Chicken Dry', category: 'Chinese Starters', price: 230 },
  { name: 'Schezwan Fries', category: 'Chinese Starters', price: 130 },
  { name: 'Dragon Chicken', category: 'Chinese Starters', price: 240 },
  { name: 'Lolipop Chicken', category: 'Chinese Starters', price: 260 },
  { name: 'Babycorn Manchurian', category: 'Chinese Starters', price: 170 },

  // NOODLES & FRIED RICE (21 items)
  { name: 'Veg Hakka Noodles', category: 'Noodles & Fried Rice', price: 160 },
  { name: 'Chicken Hakka Noodles', category: 'Noodles & Fried Rice', price: 200 },
  { name: 'Veg Schezwan Noodles', category: 'Noodles & Fried Rice', price: 170 },
  { name: 'Chicken Schezwan Noodles', category: 'Noodles & Fried Rice', price: 210 },
  { name: 'Singapore Noodles Veg', category: 'Noodles & Fried Rice', price: 180 },
  { name: 'Singapore Noodles Chicken', category: 'Noodles & Fried Rice', price: 220 },
  { name: 'Thai Basil Noodles Veg', category: 'Noodles & Fried Rice', price: 190 },
  { name: 'Thai Basil Noodles Chicken', category: 'Noodles & Fried Rice', price: 230 },
  { name: 'Crispy Noodles Veg', category: 'Noodles & Fried Rice', price: 180 },
  { name: 'Crispy Noodles Chicken', category: 'Noodles & Fried Rice', price: 220 },
  { name: 'American Chopsey Veg', category: 'Noodles & Fried Rice', price: 190 },
  { name: 'American Chopsey Chicken', category: 'Noodles & Fried Rice', price: 230 },
  { name: 'Veg Fried Rice', category: 'Noodles & Fried Rice', price: 150 },
  { name: 'Chicken Fried Rice', category: 'Noodles & Fried Rice', price: 190 },
  { name: 'Schezwan Fried Rice Veg', category: 'Noodles & Fried Rice', price: 160 },
  { name: 'Schezwan Fried Rice Chicken', category: 'Noodles & Fried Rice', price: 200 },
  { name: 'Singapore Fried Rice Veg', category: 'Noodles & Fried Rice', price: 170 },
  { name: 'Singapore Fried Rice Chicken', category: 'Noodles & Fried Rice', price: 210 },
  { name: 'Chicken Triple Rice', category: 'Noodles & Fried Rice', price: 220 },
  { name: 'Veg Triple Rice', category: 'Noodles & Fried Rice', price: 180 },
  { name: 'Combo: Noodles + Rice', category: 'Noodles & Fried Rice', price: 280 },

  // MAIN COURSE - VEG (26 items)
  { name: 'Dal Tadka', category: 'Main Course - Veg', price: 140 },
  { name: 'Dal Makhani', category: 'Main Course - Veg', price: 180 },
  { name: 'Paneer Butter Masala', category: 'Main Course - Veg', price: 220 },
  { name: 'Shahi Paneer', category: 'Main Course - Veg', price: 240 },
  { name: 'Palak Paneer', category: 'Main Course - Veg', price: 210 },
  { name: 'Kadai Paneer', category: 'Main Course - Veg', price: 220 },
  { name: 'Matar Paneer', category: 'Main Course - Veg', price: 200 },
  { name: 'Paneer Bhurji', category: 'Main Course - Veg', price: 210 },
  { name: 'Paneer Tikka Masala', category: 'Main Course - Veg', price: 250 },
  { name: 'Paneer Do Pyaza', category: 'Main Course - Veg', price: 220 },
  { name: 'Paneer Korma', category: 'Main Course - Veg', price: 230 },
  { name: 'Navratan Korma', category: 'Main Course - Veg', price: 240 },
  { name: 'Malai Kofta', category: 'Main Course - Veg', price: 220 },
  { name: 'Veg Kofta', category: 'Main Course - Veg', price: 200 },
  { name: 'Veg Makhanwala', category: 'Main Course - Veg', price: 210 },
  { name: 'Veg Kadai', category: 'Main Course - Veg', price: 190 },
  { name: 'Veg Kolhapuri', category: 'Main Course - Veg', price: 200 },
  { name: 'Mix Veg Curry', category: 'Main Course - Veg', price: 180 },
  { name: 'Aloo Jeera', category: 'Main Course - Veg', price: 130 },
  { name: 'Aloo Matar', category: 'Main Course - Veg', price: 140 },
  { name: 'Bhindi Masala', category: 'Main Course - Veg', price: 160 },
  { name: 'Baingan Bharta', category: 'Main Course - Veg', price: 170 },
  { name: 'Mushroom Masala', category: 'Main Course - Veg', price: 210 },
  { name: 'Mushroom Matar', category: 'Main Course - Veg', price: 200 },
  { name: 'Soya Chunks Masala', category: 'Main Course - Veg', price: 170 },
  { name: 'Chana Masala', category: 'Main Course - Veg', price: 150 },

  // MAIN COURSE - NON-VEG (19 items)
  { name: 'Butter Chicken', category: 'Main Course - Non-Veg', price: 280 },
  { name: 'Chicken Tikka Masala', category: 'Main Course - Non-Veg', price: 270 },
  { name: 'Chicken Handi', category: 'Main Course - Non-Veg', price: 260 },
  { name: 'Chicken Kadai', category: 'Main Course - Non-Veg', price: 260 },
  { name: 'Chicken Do Pyaza', category: 'Main Course - Non-Veg', price: 250 },
  { name: 'Chicken Korma', category: 'Main Course - Non-Veg', price: 270 },
  { name: 'Chicken Saagwala', category: 'Main Course - Non-Veg', price: 250 },
  { name: 'Murg Malaiwala', category: 'Main Course - Non-Veg', price: 260 },
  { name: 'Rogan Josh', category: 'Main Course - Non-Veg', price: 290 },
  { name: 'Mutton Masala', category: 'Main Course - Non-Veg', price: 310 },
  { name: 'Mutton Rogan Josh', category: 'Main Course - Non-Veg', price: 320 },
  { name: 'Mutton Do Pyaza', category: 'Main Course - Non-Veg', price: 300 },
  { name: 'Mutton Kadai', category: 'Main Course - Non-Veg', price: 310 },
  { name: 'Mutton Korma', category: 'Main Course - Non-Veg', price: 320 },
  { name: 'Mutton Saagwala', category: 'Main Course - Non-Veg', price: 300 },
  { name: 'Chicken宰Masala', category: 'Main Course - Non-Veg', price: 280 },
  { name: 'Egg Curry', category: 'Main Course - Non-Veg', price: 140 },
  { name: 'Egg Bhurji', category: 'Main Course - Non-Veg', price: 130 },
  { name: 'Fish Curry', category: 'Main Course - Non-Veg', price: 290 },

  // BREADS (18 items)
  { name: 'Tandoori Roti', category: 'Breads', price: 40 },
  { name: 'Butter Roti', category: 'Breads', price: 50 },
  { name: 'Plain Naan', category: 'Breads', price: 50 },
  { name: 'Butter Naan', category: 'Breads', price: 60 },
  { name: 'Garlic Naan', category: 'Breads', price: 70 },
  { name: 'Cheese Naan', category: 'Breads', price: 80 },
  { name: 'Keema Naan', category: 'Breads', price: 90 },
  { name: 'Aloo Naan', category: 'Breads', price: 70 },
  { name: 'Paneer Naan', category: 'Breads', price: 80 },
  { name: 'Pudina Paratha', category: 'Breads', price: 60 },
  { name: 'Aloo Paratha', category: 'Breads', price: 70 },
  { name: 'Gobi Paratha', category: 'Breads', price: 70 },
  { name: 'Paneer Paratha', category: 'Breads', price: 80 },
  { name: 'Missi Roti', category: 'Breads', price: 50 },
  { name: 'Laccha Paratha', category: 'Breads', price: 60 },
  { name: 'Tandoori Kulcha', category: 'Breads', price: 70 },
  { name: 'Rumali Roti', category: 'Breads', price: 40 },
  { name: 'Garlic Naan Deluxe', category: 'Breads', price: 90 },

  // BIRYANI (13 items)
  { name: 'Veg Biryani', category: 'Biryani', price: 180 },
  { name: 'Paneer Biryani', category: 'Biryani', price: 220 },
  { name: 'Chicken Biryani', category: 'Biryani', price: 260 },
  { name: 'Mutton Biryani', category: 'Biryani', price: 320 },
  { name: 'Egg Biryani', category: 'Biryani', price: 200 },
  { name: 'Hyderabadi Chicken Biryani', category: 'Biryani', price: 280 },
  { name: 'Lucknowi Chicken Biryani', category: 'Biryani', price: 280 },
  { name: 'Kolkata Chicken Biryani', category: 'Biryani', price: 280 },
  { name: 'Mutton Dum Biryani', category: 'Biryani', price: 340 },
  { name: 'Prawns Biryani', category: 'Biryani', price: 350 },
  { name: 'Paneer Tikka Biryani', category: 'Biryani', price: 240 },
  { name: 'Soya Chaap Biryani', category: 'Biryani', price: 200 },
  { name: 'Mixed Biryani', category: 'Biryani', price: 300 },

  // APPETIZERS (6 items)
  { name: 'Papad (Plain)', category: 'Appetizers', price: 30 },
  { name: 'Masala Papad', category: 'Appetizers', price: 40 },
  { name: 'Fried Papad', category: 'Appetizers', price: 35 },
  { name: 'Raita (Boondi)', category: 'Appetizers', price: 60 },
  { name: 'Raita (Mix Veg)', category: 'Appetizers', price: 70 },
  { name: 'Green Salad', category: 'Appetizers', price: 60 },

  // SOUPS (8 items)
  { name: 'Veg Clear Soup', category: 'Soups', price: 90 },
  { name: 'Chicken Clear Soup', category: 'Soups', price: 110 },
  { name: 'Veg Manchow Soup', category: 'Soups', price: 110 },
  { name: 'Chicken Manchow Soup', category: 'Soups', price: 130 },
  { name: 'Sweet Corn Soup Veg', category: 'Soups', price: 100 },
  { name: 'Sweet Corn Soup Chicken', category: 'Soups', price: 120 },
  { name: 'Tomato Soup', category: 'Soups', price: 100 },
  { name: 'Hot & Sour Soup Veg', category: 'Soups', price: 110 },

  // MOMOS & SPRING ROLLS (17 items)
  { name: 'Veg Steam Momos', category: 'Momos & Spring Rolls', price: 120 },
  { name: 'Paneer Steam Momos', category: 'Momos & Spring Rolls', price: 140 },
  { name: 'Chicken Steam Momos', category: 'Momos & Spring Rolls', price: 160 },
  { name: 'Veg Fried Momos', category: 'Momos & Spring Rolls', price: 140 },
  { name: 'Paneer Fried Momos', category: 'Momos & Spring Rolls', price: 160 },
  { name: 'Chicken Fried Momos', category: 'Momos & Spring Rolls', price: 180 },
  { name: 'Veg Tandoori Momos', category: 'Momos & Spring Rolls', price: 150 },
  { name: 'Paneer Tandoori Momos', category: 'Momos & Spring Rolls', price: 170 },
  { name: 'Chicken Tandoori Momos', category: 'Momos & Spring Rolls', price: 190 },
  { name: 'Schezwan Momos Veg', category: 'Momos & Spring Rolls', price: 160 },
  { name: 'Schezwan Momos Paneer', category: 'Momos & Spring Rolls', price: 180 },
  { name: 'Schezwan Momos Chicken', category: 'Momos & Spring Rolls', price: 200 },
  { name: 'Veg Spring Roll', category: 'Momos & Spring Rolls', price: 150 },
  { name: 'Paneer Spring Roll', category: 'Momos & Spring Rolls', price: 170 },
  { name: 'Chicken Spring Roll', category: 'Momos & Spring Rolls', price: 180 },
  { name: 'Platter: 3 Types Momos', category: 'Momos & Spring Rolls', price: 280 },
  { name: 'Kimchi Momos', category: 'Momos & Spring Rolls', price: 190 },

  // BEVERAGES (18 items)
  { name: 'Masala Chaas', category: 'Beverages', price: 50 },
  { name: 'Sweet Lassi', category: 'Beverages', price: 60 },
  { name: 'Salted Lassi', category: 'Beverages', price: 60 },
  { name: 'Mango Lassi', category: 'Beverages', price: 80 },
  { name: 'Blueberry Mojito', category: 'Beverages', price: 100 },
  { name: 'Green Apple Mojito', category: 'Beverages', price: 100 },
  { name: 'Blue Lagoon Mojito', category: 'Beverages', price: 110 },
  { name: 'Shikanji (Lemonade)', category: 'Beverages', price: 60 },
  { name: 'Jal Jeera', category: 'Beverages', price: 50 },
  { name: 'Cold Coffee', category: 'Beverages', price: 90 },
  { name: 'Chocolate Shake', category: 'Beverages', price: 100 },
  { name: 'Vanilla Shake', category: 'Beverages', price: 100 },
  { name: 'Strawberry Shake', category: 'Beverages', price: 100 },
  { name: 'Mango Shake', category: 'Beverages', price: 100 },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 70 },
  { name: 'Cold Water', category: 'Beverages', price: 20 },
  { name: 'Soft Drink (Coke/Sprite)', category: 'Beverages', price: 40 },
  { name: 'Fresh Juice (Orange/Mosambi)', category: 'Beverages', price: 90 },
];

export async function seedMenuItems() {
  try {
    console.log('🌱 Seeding menu items...');

    // Get or create default restaurant
    let restaurant = await prisma.restaurant.findFirst({
      where: { name: 'RAGSPRO POS' },
    });

    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: 'RAGSPRO POS',
          address: '123 Main Street, New Delhi, India',
        },
      });
      console.log('✅ Created default restaurant:', restaurant.id);
    }

    // Delete in correct order to respect foreign key constraints
    await prisma.bill.deleteMany({});
    console.log('🗑️  Cleared bills');

    await prisma.orderItem.deleteMany({});
    console.log('🗑️  Cleared order items');

    await prisma.order.deleteMany({});
    console.log('🗑️  Cleared orders');

    // Delete existing menu items to avoid duplicates
    await prisma.menuItem.deleteMany({
      where: { restaurantId: restaurant.id },
    });
    console.log('🗑️  Cleared menu items');

    // Insert all menu items in batch
    const createdItems = await prisma.menuItem.createMany({
      data: menuItems.map((item) => ({
        name: item.name,
        category: item.category,
        price: item.price,
        imageUrl: '',
        available: true,
        restaurantId: restaurant.id,
      })),
    });

    console.log(`✅ Successfully seeded ${createdItems.count} menu items!`);
    console.log(`📊 Categories: Tandoor Starters, Chinese Starters, Noodles & Fried Rice, Main Course (Veg/Non-Veg), Breads, Biryani, Appetizers, Soups, Momos & Spring Rolls, Beverages`);

    return createdItems.count;
  } catch (error) {
    console.error('❌ Error seeding menu items:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedMenuItems()
    .then(() => {
      console.log('Menu seeding completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}