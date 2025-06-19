
import { NextResponse, type NextRequest } from 'next/server';
import { addSale } from '@/lib/firestoreService';
import type { Sale, CartItem } from '@/lib/types';

// POST /api/sales - Add a new sale and update stock
export async function POST(request: NextRequest) {
  try {
    const saleDataFromClient = await request.json();

    // Basic validation for incoming data
    if (!saleDataFromClient || !Array.isArray(saleDataFromClient.items) || saleDataFromClient.items.length === 0) {
      return NextResponse.json({ error: 'Invalid sale data: Items are missing or empty.' }, { status: 400 });
    }
    if (typeof saleDataFromClient.totalAmount !== 'number' || typeof saleDataFromClient.paymentMethod !== 'string') {
      return NextResponse.json({ error: 'Invalid sale data: Missing total amount or payment method.' }, { status: 400 });
    }

    // Construct the data expected by firestoreService.addSale
    // Ensure saleDate is a Date object if it comes as string
    const saleDate = saleDataFromClient.saleDate ? new Date(saleDataFromClient.saleDate) : new Date();

    const salePayload: Omit<Sale, 'id' | 'saleDate' | 'items'> & { saleDate: Date, items: CartItem[] } = {
      customerId: saleDataFromClient.customerId,
      customerName: saleDataFromClient.customerName,
      items: saleDataFromClient.items, // Assuming client sends CartItem structure
      subTotal: saleDataFromClient.subTotal,
      discountPercentage: saleDataFromClient.discountPercentage,
      discountAmount: saleDataFromClient.discountAmount,
      totalAmount: saleDataFromClient.totalAmount,
      paymentMethod: saleDataFromClient.paymentMethod,
      cashGiven: saleDataFromClient.cashGiven,
      balanceReturned: saleDataFromClient.balanceReturned,
      amountPaidOnCredit: saleDataFromClient.amountPaidOnCredit,
      remainingCreditBalance: saleDataFromClient.remainingCreditBalance,
      saleDate: saleDate, // Use the converted Date object
      staffId: saleDataFromClient.staffId || "staff001", // Default staffId if not provided
    };

    const saleId = await addSale(salePayload);
    return NextResponse.json({ id: saleId, ...salePayload }, { status: 201 });

  } catch (error) {
    console.error('Error processing sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Check for specific error messages if needed
    if (errorMessage.includes("not found for stock update")) {
        return NextResponse.json({ error: 'Failed to process sale: Product not found for stock update.', details: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("Insufficient stock")) {
        return NextResponse.json({ error: 'Failed to process sale: Insufficient stock for one or more items.', details: errorMessage }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: 'Failed to process sale', details: errorMessage }, { status: 500 });
  }
}
