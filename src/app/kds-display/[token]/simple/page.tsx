import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Force this page to be server-rendered
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SimpleKDSTest({ params }: Props) {
  const { token } = await params;
  
  // Validate token server-side
  const restaurant = await prisma.restaurant.findUnique({
    where: { kdsDisplayToken: token },
    select: { id: true, name: true }
  });

  if (!restaurant) {
    notFound();
  }

  // Fetch orders server-side
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['PENDING', 'PREPARING', 'READY', 'SERVED'] },
      tableId: { not: null }
    },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true
        }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>KDS Simple Test - {restaurant.name}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            background: #0a0a0a; 
            color: #fff;
            padding: 20px;
          }
          .header {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
          }
          .header h1 { font-size: 2rem; margin-bottom: 10px; }
          .header p { color: #888; }
          .success { 
            background: #0f5132; 
            color: #d1e7dd; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            border: 2px solid #198754;
          }
          .orders {
            display: grid;
            gap: 15px;
          }
          .order {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #333;
          }
          .order-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #333;
          }
          .table-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #fff;
          }
          .status {
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
          }
          .status-PENDING { background: #ffc107; color: #000; }
          .status-PREPARING { background: #0dcaf0; color: #000; }
          .status-READY { background: #198754; color: #fff; }
          .status-SERVED { background: #6c757d; color: #fff; }
          .items {
            list-style: none;
          }
          .item {
            padding: 10px 0;
            border-bottom: 1px dashed #333;
            display: flex;
            justify-content: space-between;
          }
          .item:last-child { border-bottom: none; }
          .item-name { font-size: 1.1rem; }
          .item-qty { 
            background: #333; 
            padding: 5px 10px; 
            border-radius: 5px;
            font-weight: bold;
          }
          .no-orders {
            text-align: center;
            padding: 60px 20px;
            color: #666;
            font-size: 1.2rem;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>🧪 KDS SIMPLE TEST PAGE</h1>
          <p>Restaurant: {restaurant.name}</p>
          <p>Restaurant ID: {restaurant.id}</p>
          <p>Token: {token.substring(0, 20)}...</p>
        </div>

        <div className="success">
          ✅ SUCCESS: Server-side rendering working!<br />
          ✅ Token validated<br />
          ✅ Database connected<br />
          ✅ Page rendered without React hooks
        </div>

        <div className="orders">
          <h2 style={{ marginBottom: '15px' }}>Active Orders ({orders.length})</h2>
          
          {orders.length === 0 ? (
            <div className="no-orders">
              No active orders
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order">
                <div className="order-header">
                  <div className="table-number">
                    🍽️ Table {order.table?.number || 'N/A'}
                  </div>
                  <div className={`status status-${order.status}`}>
                    {order.status}
                  </div>
                </div>
                <ul className="items">
                  {order.items.map(item => (
                    <li key={item.id} className="item">
                      <span className="item-name">
                        {item.menuItem.name}
                        {item.portionType && ` (${item.portionType})`}
                      </span>
                      <span className="item-qty">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#1a1a1a', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px' }}>Diagnostic Info:</h3>
          <p style={{ color: '#888', lineHeight: '1.8' }}>
            • Page type: Server-Side Rendered (SSR)<br />
            • React hooks: NONE<br />
            • Client state: NONE<br />
            • JavaScript required: MINIMAL<br />
            • Timestamp: {new Date().toISOString()}
          </p>
        </div>
      </body>
    </html>
  );
}
