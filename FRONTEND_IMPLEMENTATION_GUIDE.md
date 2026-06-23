# Frontend Implementation Guide - Parts 2-7

## 🚨 CRITICAL: Implementation Priority Order

1. **Part 3: Service Charge** (Easiest, high impact)
2. **Part 4: UPI Payment** (Simple UI addition)
3. **Part 5: Revenue Breakdown** (API exists, just UI)
4. **Part 2: Menu Edit** (Moderate complexity)
5. **Part 6: Receipt Format** (CSS changes)
6. **Part 7: Performance** (Investigation required)

---

## ✅ Part 3: Service Charge Toggle (HIGH PRIORITY)

**File**: `/src/components/billing/PaymentModal.tsx`

### Step 1: Add State Variables
```typescript
// Add near other state declarations (around line 30-40)
const [serviceChargeApplied, setServiceChargeApplied] = useState(false);
const [serviceChargeAmount, setServiceChargeAmount] = useState(0);
const SERVICE_CHARGE_RATE = 0.10; // 10%
```

### Step 2: Find GST Toggle Section
Search for "Apply GST" in the file (around line 498-517)

### Step 3: Add Service Charge Toggle Below GST
```tsx
{/* Add this RIGHT AFTER the GST toggle */}
{/* Service Charge Toggle */}
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  <div>
    <span className="text-sm font-medium">Apply Service Charge (10%)</span>
    <div className="text-xs text-gray-500">
      ₹{(bill.subtotal * SERVICE_CHARGE_RATE).toFixed(2)}
    </div>
  </div>
  <button
    type="button"
    onClick={() => {
      const newValue = !serviceChargeApplied;
      setServiceChargeApplied(newValue);
      const newServiceCharge = newValue ? bill.subtotal * SERVICE_CHARGE_RATE : 0;
      setServiceChargeAmount(newServiceCharge);
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      serviceChargeApplied ? 'bg-green-600' : 'bg-gray-200'
    }`}
    aria-label="Toggle service charge"
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        serviceChargeApplied ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>
```

### Step 4: Update Total Calculation
Find the `calculateFinalTotal` function (around line 18-24) and modify:

```typescript
const calculateFinalTotal = (
  bill: any, 
  discountPct: number = 0, 
  pointsAmt: number = 0, 
  includeGst: boolean = true,
  serviceCharge: number = 0  // ADD THIS PARAMETER
) => {
  const baseAmount = bill.subtotal + (includeGst ? (bill.tax || 0) : 0) + serviceCharge; // ADD serviceCharge
  const discountAmt = (bill.subtotal * discountPct) / 100;
  return Math.max(0, baseAmount - discountAmt - pointsAmt);
};
```

### Step 5: Update Bill Creation
Find where bill is created/updated (search for "POST /api/bills" or bill creation) and add:

```typescript
const billData = {
  // ... existing fields
  serviceChargeApplied: serviceChargeApplied,
  serviceChargeAmount: serviceChargeAmount,
  total: calculateFinalTotal(bill, discountPercentage, pointsAmount, gstApplied, serviceChargeAmount)
};
```

### Step 6: Display Service Charge in Totals
Find the totals display section and add:

```tsx
{/* Add after GST row */}
{serviceChargeApplied && (
  <div className="flex justify-between text-sm">
    <span>Service Charge (10%):</span>
    <span>₹{serviceChargeAmount.toFixed(2)}</span>
  </div>
)}
```

---

## ✅ Part 4: UPI Payment Method (EASY)

**File**: `/src/components/billing/PaymentModal.tsx`

### Step 1: Update Payment Method State
Find payment method state (search for "paymentMethod" state):

```typescript
// Ensure paymentMethod can be 'UPI'
type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
```

### Step 2: Find Payment Method Buttons
Search for "Cash" button (around line 560-591), you'll see something like:

```tsx
<div className="grid grid-cols-3 gap-4">  {/* CHANGE to grid-cols-4 */}
  {/* Cash Button */}
  <button ...>Cash</button>
  
  {/* ADD UPI Button HERE */}
  <button
    type="button"
    onClick={() => setPaymentMethod('UPI')}
    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
      paymentMethod === 'UPI'
        ? 'border-green-500 bg-green-50 shadow-md'
        : 'border-gray-300 hover:border-gray-400'
    }`}
  >
    <div className="text-4xl mb-2">📱</div>
    <div className="font-semibold text-sm">UPI</div>
    <div className="text-xs text-gray-500 mt-1">Scan QR</div>
  </button>
  
  {/* Card Button */}
  <button ...>Card</button>
  
  {/* Split Button */}
  <button ...>Split</button>
</div>
```

### Step 3: Update Bill Submission
When creating bill, ensure paymentMethod includes 'UPI':

```typescript
const billData = {
  // ... other fields
  paymentMethod: paymentMethod, // This will now include 'UPI'
};
```

**That's it!** UPI payment complete. No API changes needed.

---

## ✅ Part 5: Revenue Breakdown by Payment Method

**File**: `/src/app/api/reports/route.ts` (API Update)

### Step 1: Update Reports API
Find the GET handler and modify to include breakdown:

```typescript
export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // ... existing date parsing

    const bills = await prisma.bill.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: start,
          lte: end,
        },
        order: {
          table: {
            restaurantId: (auth.session.user as any).restaurantId
          }
        }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    // NEW: Calculate breakdown by payment method
    const breakdown = bills.reduce((acc: any, bill: any) => {
      const method = bill.paymentMethod || 'CASH';
      acc[method] = (acc[method] || 0) + bill.total;
      return acc;
    }, {});

    const totalRevenue = bills.reduce((sum: number, bill: any) => sum + bill.total, 0);

    return NextResponse.json({
      // ... existing fields
      breakdown: {
        cash: breakdown['CASH'] || 0,
        upi: breakdown['UPI'] || 0,
        card: breakdown['CARD'] || 0,
        split: breakdown['SPLIT'] || 0,
        total: totalRevenue
      }
    });
  } catch (error) {
    // ... error handling
  }
}
```

**File**: Revenue Display Component (wherever revenue is shown)

### Step 2: Display Breakdown in UI
```tsx
{/* Add this in revenue modal/display */}
<div className="border-t pt-4 mt-4">
  <h4 className="font-semibold mb-3">Payment Method Breakdown</h4>
  <div className="space-y-2 text-sm">
    {data.breakdown.cash > 0 && (
      <div className="flex justify-between">
        <span className="flex items-center">
          <span className="text-xl mr-2">💵</span> Cash
        </span>
        <span className="font-semibold">₹{data.breakdown.cash.toFixed(2)}</span>
      </div>
    )}
    {data.breakdown.upi > 0 && (
      <div className="flex justify-between">
        <span className="flex items-center">
          <span className="text-xl mr-2">📱</span> UPI
        </span>
        <span className="font-semibold">₹{data.breakdown.upi.toFixed(2)}</span>
      </div>
    )}
    {data.breakdown.card > 0 && (
      <div className="flex justify-between">
        <span className="flex items-center">
          <span className="text-xl mr-2">💳</span> Card
        </span>
        <span className="font-semibold">₹{data.breakdown.card.toFixed(2)}</span>
      </div>
    )}
    <div className="flex justify-between pt-2 border-t font-bold text-base">
      <span>Total Revenue</span>
      <span className="text-green-600">₹{data.breakdown.total.toFixed(2)}</span>
    </div>
  </div>
</div>
```

---

## ✅ Part 2: Menu Edit Features

**File**: `/src/components/modals/ManageMenuModal.tsx` (or similar)

### Step 1: Add Edit State
```typescript
const [editingItem, setEditingItem] = useState<any>(null);
const [showEditForm, setShowEditForm] = useState(false);
const [categories, setCategories] = useState<string[]>([]);
```

### Step 2: Fetch Categories
```typescript
useEffect(() => {
  // Fetch categories for dropdown
  fetch('/api/menu/categories')
    .then(res => res.json())
    .then(data => setCategories(data))
    .catch(err => console.error('Failed to load categories:', err));
}, []);
```

### Step 3: Add Edit Button to Menu Items
```tsx
{/* In menu item row, add Edit button */}
<button
  onClick={() => {
    setEditingItem(item);
    setShowEditForm(true);
  }}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
  Edit
</button>
```

### Step 4: Create Edit Form
```tsx
{showEditForm && editingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">Edit Menu Item</h3>
      
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        try {
          const response = await fetch(`/api/menu/${editingItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.get('name'),
              price: formData.get('price'),
              priceHalf: formData.get('priceHalf') || null,
              category: formData.get('category'),
              dietType: formData.get('dietType'),
              hasHalfFullOption: formData.get('hasHalfFullOption') === 'on',
              stockQuantity: formData.get('stockQuantity') || null,
              available: formData.get('available') === 'on',
              imageUrl: formData.get('imageUrl'),
            })
          });
          
          if (response.ok) {
            toast.success('Menu item updated successfully');
            setShowEditForm(false);
            // Refresh menu list
            fetchMenuItems();
          } else {
            toast.error('Failed to update menu item');
          }
        } catch (error) {
          console.error('Error updating menu item:', error);
          toast.error('Error updating menu item');
        }
      }}>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={editingItem.name}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Category - DROPDOWN WITH EXISTING CATEGORIES */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              defaultValue={editingItem.category}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ Add New Category</option>
            </select>
            {/* If "Add New" selected, show text input */}
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Price (₹)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                defaultValue={editingItem.price}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Half Price (₹)</label>
              <input
                type="number"
                name="priceHalf"
                step="0.01"
                defaultValue={editingItem.priceHalf || ''}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Diet Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Diet Type</label>
            <select
              name="dietType"
              defaultValue={editingItem.dietType}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="VEG">Vegetarian</option>
              <option value="NON_VEG">Non-Vegetarian</option>
            </select>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1">Stock Quantity (optional)</label>
            <input
              type="number"
              name="stockQuantity"
              defaultValue={editingItem.stockQuantity || ''}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="hasHalfFullOption"
                defaultChecked={editingItem.hasHalfFullOption}
                className="mr-2"
              />
              <span className="text-sm">Has Half/Full Option</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="available"
                defaultChecked={editingItem.available}
                className="mr-2"
              />
              <span className="text-sm">Available</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setShowEditForm(false)}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## ✅ Part 6: Receipt Format - Watermark & 80mm Sizing

**File**: `/src/components/billing/PaymentModal.tsx` (in printReceipt function)

### Update Receipt HTML CSS
Find the `<style>` section in printReceipt function and update:

```css
<style>
  /* ADD/UPDATE these rules */
  @page {
    size: 80mm auto;  /* 80mm thermal paper */
    margin: 0;
  }
  
  body {
    font-family: 'Courier New', monospace;  /* Monospace for alignment */
    font-size: 12px;
    line-height: 1.4;
    color: #000;
    background: #fff;
    padding: 10px;
    width: 72mm;  /* Content width for 80mm paper */
    max-width: 72mm;
    margin: 0 auto;
    position: relative;
  }
  
  /* ADD: Watermark */
  body::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background-image: url('/images/Gen-z-logo.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    opacity: 0.05;  /* 5% opacity for subtle watermark */
    z-index: -1;
    pointer-events: none;
  }
  
  /* Ensure proper alignment with monospace */
  .item-row {
    display: flex;
    justify-content: space-between;
    font-family: 'Courier New', monospace;
  }
  
  .item-price {
    font-weight: bold;
    min-width: 70px;
    text-align: right;
    font-family: 'Courier New', monospace;
  }
</style>
```

---

## ✅ Part 7: Order Placement Speed Optimization

### Step 1: Add Performance Logging

**File**: `/src/app/api/orders/route.ts`

```typescript
export async function POST(request: Request) {
  console.time('⏱️ TOTAL-ORDER-CREATION');
  
  // ... existing auth check
  
  console.time('⏱️ DB-MENU-FETCH');
  const menuItems = await prisma.menuItem.findMany({...});
  console.timeEnd('⏱️ DB-MENU-FETCH');
  
  console.time('⏱️ TRANSACTION');
  const result = await prisma.$transaction(async (tx) => {
    // ... transaction logic
  });
  console.timeEnd('⏱️ TRANSACTION');
  
  console.timeEnd('⏱️ TOTAL-ORDER-CREATION');
  
  return NextResponse.json(result.order, { status: 201 });
}
```

### Step 2: Optimize Stock Updates
Find the stock update loop and parallelize:

```typescript
// BEFORE (Sequential):
for (const item of orderItemsData) {
  const menuItem = menuItemMap.get(item.menuItemId);
  if (menuItem && menuItem.stockQuantity !== null) {
    await tx.menuItem.update({ where: { id: item.menuItemId }, ... });
  }
}

// AFTER (Parallel):
await Promise.all(
  orderItemsData
    .filter(item => {
      const menuItem = menuItemMap.get(item.menuItemId);
      return menuItem && menuItem.stockQuantity !== null;
    })
    .map(item => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const newStock = menuItem.stockQuantity! - item.quantity;
      return tx.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          stockQuantity: Math.max(0, newStock),
          available: newStock > 0 ? menuItem.available : false
        }
      });
    })
);
```

### Step 3: Reduce Response Payload
Use `select` to return only necessary fields:

```typescript
// Instead of include: { table: true, items: { include: { menuItem: true } } }
// Use select:
return tx.order.findUnique({
  where: { id: newOrder.id },
  select: {
    id: true,
    tableId: true,
    totalAmount: true,
    status: true,
    table: {
      select: { number: true, status: true }
    },
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
        menuItem: {
          select: { name: true, category: true }
        }
      }
    }
  }
});
```

---

## 📋 Implementation Checklist

### Priority 1 (Do First):
- [ ] Part 3: Service Charge Toggle in PaymentModal
- [ ] Part 4: UPI Payment Button
- [ ] Part 5: Revenue Breakdown Display

### Priority 2 (Next):
- [ ] Part 2: Menu Edit Form
- [ ] Part 2: Category Dropdown
- [ ] Part 6: Receipt Watermark
- [ ] Part 6: 80mm Sizing

### Priority 3 (Optimization):
- [ ] Part 7: Add Performance Logging
- [ ] Part 7: Optimize Stock Updates
- [ ] Part 7: Reduce Response Payload

---

## 🧪 Testing After Implementation

1. **Service Charge**: Create bill, toggle service charge, verify it's saved
2. **UPI**: Select UPI payment, verify paymentMethod saved as 'UPI'
3. **Revenue**: Check reports show Cash/UPI/Card breakdown
4. **Menu Edit**: Edit item price, save, verify changes
5. **Receipt**: Print receipt, check watermark and paper width
6. **Performance**: Check console for timing logs

---

## 🚨 Common Pitfalls to Avoid

1. **Service Charge**: Must add to base amount BEFORE final total calculation
2. **UPI**: Change grid-cols-3 to grid-cols-4 for payment buttons
3. **Menu Edit**: Use PATCH endpoint, not PUT
4. **Categories**: Fetch from `/api/menu/categories`, not hardcoded
5. **Receipt**: Watermark needs z-index: -1 to stay behind text
6. **Performance**: Use Promise.all for parallel operations, not sequential await

---

**Ready to implement! Start with Part 3 (Service Charge) - it's the easiest and highest value.**
