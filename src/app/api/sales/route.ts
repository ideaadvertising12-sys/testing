
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

    // Basic validation for core sale structure
    if (!saleDataFromClient || !Array.isArray(saleDataFromClient.items) || saleDataFromClient.items.length === 0) {
      return NextResponse.json({ error: 'Invalid sale data: Items are missing or empty.' }, { status: 400 });
    }
    if (typeof saleDataFromClient.totalAmount !== 'number' || 
        typeof saleDataFromClient.totalAmountPaid !== 'number' ||
        typeof saleDataFromClient.outstandingBalance !== 'number' ||
        typeof saleDataFromClient.paymentSummary !== 'string') {
      return NextResponse.json({ error: 'Invalid sale data: Missing core payment fields (totalAmount, totalAmountPaid, outstandingBalance, paymentSummary).' }, { status: 400 });
    }

    // Validate payment breakdown
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
        // Basic check, can be more granular (e.g. require bankName or referenceNumber)
        return NextResponse.json({ error: 'Bank transfer details are required for bank transfer payments.' }, { status: 400 });
    }

    const saleDate = saleDataFromClient.saleDate ? new Date(saleDataFromClient.saleDate) : new Date();
    
    // --- Defensive Object Construction to avoid 'undefined' ---
    let chequeDetailsForDb: ChequeInfo | undefined = undefined;
    if (saleDataFromClient.chequeDetails) {
        const details: ChequeInfo = {};
        if (saleDataFromClient.chequeDetails.number) details.number = saleDataFromClient.chequeDetails.number;
        if (saleDataFromClient.chequeDetails.bank) details.bank = saleDataFromClient.chequeDetails.bank;
        if (saleDataFromClient.chequeDetails.date) details.date = new Date(saleDataFromClient.chequeDetails.date);
        if (saleDataFromClient.chequeDetails.amount) details.amount = saleDataFromClient.chequeDetails.amount;
        if (Object.keys(details).length > 0) chequeDetailsForDb = details;
    }

    let bankTransferDetailsForDb: BankTransferInfo | undefined = undefined;
    if (saleDataFromClient.bankTransferDetails) {
        const details: BankTransferInfo = {};
        if (saleDataFromClient.bankTransferDetails.bankName) details.bankName = saleDataFromClient.bankTransferDetails.bankName;
        if (saleDataFromClient.bankTransferDetails.referenceNumber) details.referenceNumber = saleDataFromClient.bankTransferDetails.referenceNumber;
        if (saleDataFromClient.bankTransferDetails.amount) details.amount = saleDataFromClient.bankTransferDetails.amount;
        if (Object.keys(details).length > 0) bankTransferDetailsForDb = details;
    }

    const salePayload: Omit<Sale, 'id'> = {
      // Required fields
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

    // Add optional fields only if they have a value
    if (saleDataFromClient.customerId) salePayload.customerId = saleDataFromClient.customerId;
    if (saleDataFromClient.customerName) salePayload.customerName = saleDataFromClient.customerName;
    if (saleDataFromClient.paidAmountCash) salePayload.paidAmountCash = saleDataFromClient.paidAmountCash;
    if (saleDataFromClient.paidAmountCheque) salePayload.paidAmountCheque = saleDataFromClient.paidAmountCheque;
    if (chequeDetailsForDb) salePayload.chequeDetails = chequeDetailsForDb;
    if (saleDataFromClient.paidAmountBankTransfer) salePayload.paidAmountBankTransfer = saleDataFromClient.paidAmountBankTransfer;
    if (bankTransferDetailsForDb) salePayload.bankTransferDetails = bankTransferDetailsForDb;
    if (saleDataFromClient.creditUsed) salePayload.creditUsed = saleDataFromClient.creditUsed;
    if (saleDataFromClient.outstandingBalance) salePayload.initialOutstandingBalance = saleDataFromClient.outstandingBalance;
    if (saleDataFromClient.changeGiven) salePayload.changeGiven = saleDataFromClient.changeGiven;
    if (saleDataFromClient.staffName) salePayload.staffName = saleDataFromClient.staffName;
    if (saleDataFromClient.vehicleId) salePayload.vehicleId = saleDataFromClient.vehicleId;
    
    // --- End Defensive Object Construction ---

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
