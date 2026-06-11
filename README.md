# Gen-Z Restaurant POS (RagsPOS v1)

A Point of Sale system built for Gen-Z restaurants using the RAGSBUILD-generated stack.

## Tech Stack
- **Frontend**: Next.js 14 (React) + Tailwind CSS
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL (via Supabase in production)
- **Authentication**: Placeholder (can be extended with NextAuth)
- **Realtime**: Ready for Supabase Realtime subscriptions

## Features Implemented
1. **Table Management** - Add, view, and manage restaurant tables with status tracking
2. **Menu Management** - Full CRUD for menu items with categories, pricing, and availability
3. **Order Taking** - Create orders for tables with multiple items, special instructions, and customer info
4. **KOT (Kitchen Order Ticket)** - Real-time kitchen display with order timers and status updates
5. **Bill Generation** - Generate bills with tax calculations, payment tracking, and print functionality
6. **Sales Reports** - Daily sales reports with analytics, top-selling items, and payment method breakdowns

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Push schema to database (optional - for development):
   ```bash
   npx prisma db push
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Visit http://localhost:3000 to access the POS system

## Project Structure
- `src/app/(pos)/` - All POS-related pages (tables, menu, orders, KOT, bills, reports)
- `src/app/(auth)/` - Authentication pages (login, register)
- `src/app/(dashboard)/` - Dashboard placeholder
- `src/app/(marketing)/` - Marketing placeholder
- `src/components/` - Reusable UI components (forms, buttons, inputs, etc.)
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database schema definition

## API Routes
The system uses Next.js API routes implicitly through React Server Components and direct database access via Prisma.

## Future Enhancements
- Authentication system (NextAuth or custom)
- Real-time updates with Supabase Realtime for KOT screens
- Role-based access control (server, manager, admin)
- Integration with payment gateways (Razorpay, Stripe, UPI)
- Receipt printing via thermal printers
- Inventory management
- Customer relationship management (CRM)
- Online ordering integration

## Notes
- This is a MVP implementation focusing on core POS functionality
- Error handling and validation can be enhanced
- Styling can be further customized with additional Tailwind configurations
- For production, consider adding proper authentication and authorization
