/**
 * Bill Utilities
 * Shared functions for billing and payment calculations
 */

import { TAX, LOYALTY, SERVICE_CHARGE } from './constants';

// ═══════════════════════════════════════════════════════════════════
// TAX CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate GST (CGST + SGST) from subtotal
 */
export function calculateGST(subtotal: number, taxRate: number = TAX.GST_RATE): number {
  return subtotal * taxRate;
}

/**
 * Calculate CGST (Central GST)
 */
export function calculateCGST(subtotal: number): number {
  return subtotal * TAX.CGST_RATE;
}

/**
 * Calculate SGST (State GST)
 */
export function calculateSGST(subtotal: number): number {
  return subtotal * TAX.SGST_RATE;
}

/**
 * Get tax breakdown
 */
export function getTaxBreakdown(subtotal: number, taxRate: number = TAX.GST_RATE): {
  total: number;
  cgst: number;
  sgst: number;
  rate: number;
} {
  const total = calculateGST(subtotal, taxRate);
  return {
    total,
    cgst: total / 2,
    sgst: total / 2,
    rate: taxRate,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE CHARGE
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate service charge
 */
export function calculateServiceCharge(
  subtotal: number,
  rate: number = SERVICE_CHARGE.DEFAULT_RATE
): number {
  // Validate rate
  if (rate < 0 || rate > SERVICE_CHARGE.MAX_RATE) {
    throw new Error(`Service charge rate must be between 0 and ${SERVICE_CHARGE.MAX_RATE}`);
  }
  return subtotal * rate;
}

// ═══════════════════════════════════════════════════════════════════
// DISCOUNT
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscount(subtotal: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  return (subtotal * discountPercent) / 100;
}

/**
 * Apply discount to amount
 */
export function applyDiscount(amount: number, discountPercent: number): number {
  return amount - calculateDiscount(amount, discountPercent);
}

// ═══════════════════════════════════════════════════════════════════
// LOYALTY POINTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate loyalty points earned from bill amount
 */
export function calculatePointsEarned(billAmount: number): number {
  // Points per ₹100 spent
  const pointsPerUnit = LOYALTY.POINTS_PER_100_RUPEES;
  return Math.floor(billAmount / 100) * pointsPerUnit;
}

/**
 * Calculate rupees value of points
 */
export function calculatePointsValue(points: number): number {
  return points * LOYALTY.REDEMPTION_VALUE_PER_POINT;
}

/**
 * Check if points can be redeemed
 */
export function canRedeemPoints(points: number): boolean {
  return points >= LOYALTY.MIN_POINTS_TO_REDEEM;
}

/**
 * Calculate maximum points that can be redeemed for a bill
 * (Can't redeem more than bill total)
 */
export function getMaxRedeemablePoints(billTotal: number, availablePoints: number): number {
  const maxPointsByBill = Math.floor(billTotal / LOYALTY.REDEMPTION_VALUE_PER_POINT);
  return Math.min(maxPointsByBill, availablePoints);
}

// ═══════════════════════════════════════════════════════════════════
// BILL CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

export interface BillCalculation {
  subtotal: number;
  serviceCharge: number;
  tax: number;
  cgst: number;
  sgst: number;
  discount: number;
  pointsRedeemed: number;
  total: number;
  pointsEarned: number;
}

/**
 * Calculate complete bill breakdown
 */
export function calculateBill(params: {
  subtotal: number;
  applyGST?: boolean;
  taxRate?: number;
  applyServiceCharge?: boolean;
  serviceChargeRate?: number;
  discountPercent?: number;
  pointsToRedeem?: number;
}): BillCalculation {
  const {
    subtotal,
    applyGST = true,
    taxRate = TAX.GST_RATE,
    applyServiceCharge = false,
    serviceChargeRate = SERVICE_CHARGE.DEFAULT_RATE,
    discountPercent = 0,
    pointsToRedeem = 0,
  } = params;

  // Service charge (applied to subtotal)
  const serviceCharge = applyServiceCharge 
    ? calculateServiceCharge(subtotal, serviceChargeRate)
    : 0;

  // Tax (applied to subtotal + service charge)
  const taxableAmount = subtotal + serviceCharge;
  const tax = applyGST ? calculateGST(taxableAmount, taxRate) : 0;
  const cgst = tax / 2;
  const sgst = tax / 2;

  // Discount (applied to subtotal + service charge + tax)
  const beforeDiscount = taxableAmount + tax;
  const discount = calculateDiscount(beforeDiscount, discountPercent);

  // Points redeemed (applied after discount)
  const afterDiscount = beforeDiscount - discount;
  const pointsValue = calculatePointsValue(pointsToRedeem);
  const pointsRedeemed = Math.min(pointsValue, afterDiscount);

  // Final total
  const total = Math.max(0, afterDiscount - pointsRedeemed);

  // Points earned (based on final paid amount, not subtotal)
  const pointsEarned = calculatePointsEarned(total);

  return {
    subtotal,
    serviceCharge,
    tax,
    cgst,
    sgst,
    discount,
    pointsRedeemed,
    total,
    pointsEarned,
  };
}

/**
 * Recalculate bill total from existing bill data
 */
export function recalculateBillTotal(bill: any): number {
  const subtotal = bill.subtotal || 0;
  const tax = bill.tax || 0;
  const serviceCharge = bill.serviceChargeAmount || 0;
  const discount = bill.discount || 0;
  const pointsRedeemed = bill.pointsRedeemed || 0;

  return Math.max(0, subtotal + tax + serviceCharge - discount - pointsRedeemed);
}

// ═══════════════════════════════════════════════════════════════════
// SPLIT PAYMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate split payment amounts
 */
export function validateSplitPayment(
  total: number,
  cashAmount: number,
  onlineAmount: number
): { valid: boolean; error?: string } {
  const sum = cashAmount + onlineAmount;
  const tolerance = 0.01; // Allow 1 paisa tolerance for rounding

  if (Math.abs(sum - total) > tolerance) {
    return {
      valid: false,
      error: `Split payment sum (₹${sum.toFixed(2)}) must equal total (₹${total.toFixed(2)})`,
    };
  }

  if (cashAmount < 0 || onlineAmount < 0) {
    return {
      valid: false,
      error: 'Payment amounts cannot be negative',
    };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Format currency value (Indian Rupees)
 */
export function formatCurrency(amount: number, includeSymbol: boolean = true): string {
  const formatted = amount.toFixed(2);
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format bill number for display
 */
export function formatBillNumber(billId: string): string {
  return billId.slice(-6).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if bill can be paid
 */
export function canPayBill(bill: any): boolean {
  // Must be in PENDING status
  if (bill.status !== 'PENDING') {
    return false;
  }

  // Must have a positive total
  if (bill.total <= 0) {
    return false;
  }

  return true;
}

/**
 * Check if bill can be cancelled
 */
export function canCancelBill(bill: any): boolean {
  // Can only cancel PENDING bills
  return bill.status === 'PENDING';
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const billUtils = {
  // Tax
  calculateGST,
  calculateCGST,
  calculateSGST,
  getTaxBreakdown,
  
  // Service Charge
  calculateServiceCharge,
  
  // Discount
  calculateDiscount,
  applyDiscount,
  
  // Loyalty
  calculatePointsEarned,
  calculatePointsValue,
  canRedeemPoints,
  getMaxRedeemablePoints,
  
  // Bill Calculations
  calculateBill,
  recalculateBillTotal,
  
  // Split Payment
  validateSplitPayment,
  
  // Formatting
  formatCurrency,
  formatBillNumber,
  
  // Validation
  canPayBill,
  canCancelBill,
};

export default billUtils;
