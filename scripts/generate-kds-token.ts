import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function generateKDSToken() {
  try {
    // Get the first restaurant (there should only be one)
    const restaurant = await prisma.restaurant.findFirst();
    
    if (!restaurant) {
      console.error('❌ No restaurant found in database');
      process.exit(1);
    }
    
    // Check if token already exists
    if (restaurant.kdsDisplayToken) {
      console.log('✅ Restaurant already has KDS Display Token:');
      console.log('Token:', restaurant.kdsDisplayToken);
      console.log(`\nURL: https://pos.gen-z.online/kds-display/${restaurant.kdsDisplayToken}`);
      return;
    }
    
    // Generate a secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Update restaurant with the token
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { kdsDisplayToken: token }
    });
    
    console.log('✅ KDS Display Token generated successfully!');
    console.log('Token:', token);
    console.log(`\nURL: https://pos.gen-z.online/kds-display/${token}`);
    console.log('\n🔒 Keep this URL secure - it provides read-only access to kitchen orders.');
  } catch (error) {
    console.error('❌ Error generating token:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateKDSToken();
