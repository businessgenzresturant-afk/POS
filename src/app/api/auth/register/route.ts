import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import * as bcrypt from 'bcryptjs';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { checkAuth } from '@/lib/api-auth';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.AUTH);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  // Restrict to ADMIN - only admins can create new user accounts
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;
  
  if ((auth.session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required to create users' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use admin's restaurant
    const restaurantId = (auth.session.user as any).restaurantId;

    // Create user with specified role or default to STAFF
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
        restaurantId,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}