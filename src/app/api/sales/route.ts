
import { NextResponse, type NextRequest } from 'next/server';
import { addSale, getSales } from '@/lib/firestoreService';
import type { Sale, CartItem, ChequeInfo, BankTransferInfo } from '@/lib/types'; 

// GET /api/sales - Fetch all sales
export async function GET(request: NextRequest) {
  try {
    const sales = await getSales();
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch sales', details: errorMessage }, { status: 500 });
  }
}

// POST /api/sales - Add a new sale and update stock
export async function POST(request: NextRequest) {
  try {
    const saleDataFromClient = await request.json();

    // --- Start Validation ---
    if (!saleDataFromClient || !Array.isArray(saleDataFromClient.items) || saleDataFromClient.items.length === 0) {
      return NextResponse.json({ error: 'Invalid sale data: Items are missing or empty.' }, { status: 400 });
    }
    if (typeof saleDataFromClient.totalAmount !== 'number' || 
        typeof saleDataFromClient.totalAmountPaid !== 'number' ||
        typeof saleDataFromClient.outstandingBalance !== 'number' ||
        typeof saleDataFromClient.paymentSummary !== 'string') {
      return NextResponse.json({ error: 'Invalid sale data: Missing core payment fields (totalAmount, totalAmountPaid, outstandingBalance, paymentSummary).' }, { status: 400 });
    }

    if (saleDataFromClient.paidAmountCash !== undefined && typeof saleDataFromClient.paidAmountCash !== 'number') {
        return NextResponse.json({ error: 'Invalid cash payment amount.' }, { status: 400 });
    }
    if (saleDataFromClient.paidAmountCheque !== undefined && typeof saleDataFromClient.paidAmountCheque !== 'number') {
        return NextResponse.json({ error: 'Invalid cheque payment amount.' }, { status: 400 });
    }
    if (saleDataFromClient.paidAmountBankTransfer !== undefined && typeof saleDataFromClient.paidAmountBankTransfer !== 'number') {
        return NextResponse.json({ error: 'Invalid bank transfer payment amount.' }, { status: 400 });
    }
     if (saleDataFromClient.creditUsed !== undefined && typeof saleDataFromClient.creditUsed !== 'number') {
        return NextResponse.json({ error: 'Invalid credit used amount.' }, { status: 400 });
    }

    if (saleDataFromClient.paidAmountCheque > 0 && (!saleDataFromClient.chequeDetails || !saleDataFromClient.chequeDetails.number)) {
        return NextResponse.json({ error: 'Cheque number is required for cheque payments.' }, { status: 400 });
    }
    if (saleDataFromClient.chequeDetails && saleDataFromClient.chequeDetails.date && isNaN(new Date(saleDataFromClient.chequeDetails.date).getTime())) {
        return NextResponse.json({ error: 'Invalid cheque date provided.' }, { status: 400 });
    }
    if (saleDataFromClient.paidAmountBankTransfer > 0 && !saleDataFromClient.bankTransferDetails) {
        return NextResponse.json({ error: 'Bank transfer details are required for bank transfer payments.' }, { status: 400 });
    }
    // --- End Validation ---

    const saleDate = saleDataFromClient.saleDate ? new Date(saleDataFromClient.saleDate) : new Date();
    
    // --- Start Defensive Payload Construction ---
    // Start with a base object of required fields
    const salePayload: Omit<Sale, 'id'> = {
      items: saleDataFromClient.items as CartItem[],
      subTotal: saleDataFromClient.subTotal,
      discountPercentage: saleDataFromClient.discountPercentage,
      discountAmount: saleDataFromClient.discountAmount,
      totalAmount: saleDataFromClient.totalAmount,
      totalAmountPaid: saleDataFromClient.totalAmountPaid,
      outstandingBalance: saleDataFromClient.outstandingBalance,
      paymentSummary: saleDataFromClient.paymentSummary,
      saleDate: saleDate,
      staffId: saleDataFromClient.staffId || "staff001",
      offerApplied: saleDataFromClient.offerApplied || false,
    };

    // Conditionally add optional fields ONLY if they are not undefined
    if (saleDataFromClient.customerId !== undefined) salePayload.customerId = saleDataFromClient.customerId;
    if (saleDataFromClient.customerName !== undefined) salePayload.customerName = saleDataFromClient.customerName;
    if (saleDataFromClient.staffName !== undefined) salePayload.staffName = saleDataFromClient.staffName;
    if (saleDataFromClient.vehicleId !== undefined) salePayload.vehicleId = saleDataFromClient.vehicleId;
    
    // Check for numeric fields, including 0
    if (saleDataFromClient.paidAmountCash !== undefined) salePayload.paidAmountCash = saleDataFromClient.paidAmountCash;
    if (saleDataFromClient.paidAmountCheque !== undefined) salePayload.paidAmountCheque = saleDataFromClient.paidAmountCheque;
    if (saleDataFromClient.paidAmountBankTransfer !== undefined) salePayload.paidAmountBankTransfer = saleDataFromClient.paidAmountBankTransfer;
    if (saleDataFromClient.creditUsed !== undefined) salePayload.creditUsed = saleDataFromClient.creditUsed;
    if (saleDataFromClient.changeGiven !== undefined) salePayload.changeGiven = saleDataFromClient.changeGiven;

    // Special logic for initial outstanding balance - only set if it was a credit sale
    if (saleDataFromClient.outstandingBalance > 0) {
      salePayload.initialOutstandingBalance = saleDataFromClient.outstandingBalance;
    }

    // Defensively construct nested objects
    if (saleDataFromClient.chequeDetails) {
        const details: ChequeInfo = {};
        if (saleDataFromClient.chequeDetails.number) details.number = saleDataFromClient.chequeDetails.number;
        if (saleDataFromClient.chequeDetails.bank) details.bank = saleDataFromClient.chequeDetails.bank;
        if (saleDataFromClient.chequeDetails.date) details.date = new Date(saleDataFromClient.chequeDetails.date);
        if (saleDataFromClient.chequeDetails.amount !== undefined) details.amount = saleDataFromClient.chequeDetails.amount;
        if (Object.keys(details).length > 0) salePayload.chequeDetails = details;
    }

    if (saleDataFromClient.bankTransferDetails) {
        const details: BankTransferInfo = {};
        if (saleDataFromClient.bankTransferDetails.bankName) details.bankName = saleDataFromClient.bankTransferDetails.bankName;
        if (saleDataFromClient.bankTransferDetails.referenceNumber) details.referenceNumber = saleDataFromClient.bankTransferDetails.referenceNumber;
        if (saleDataFromClient.bankTransferDetails.amount !== undefined) details.amount = saleDataFromClient.bankTransferDetails.amount;
        if (Object.keys(details).length > 0) salePayload.bankTransferDetails = details;
    }
    // --- End Defensive Payload Construction ---

    const saleId = await addSale(salePayload);
    
    return NextResponse.json({ id: saleId, ...salePayload, saleDate: saleDate.toISOString() }, { status: 201 });

  } catch (error) {
    console.error('Error processing sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("not found for stock update")) {
        return NextResponse.json({ error: 'Failed to process sale: Product not found for stock update.', details: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("Insufficient stock")) {
        return NextResponse.json({ error: 'Failed to process sale: Insufficient stock for one or more items.', details: errorMessage }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to process sale', details: errorMessage }, { status: 500 });
  }
}
