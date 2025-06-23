
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction, Timestamp, arrayUnion } from 'firebase/firestore';
import { saleConverter, type Sale, type Payment, type FirestorePayment } from '@/lib/types';
import { getAuth } from "firebase-admin/auth";
import { adminApp } from '@/lib/firebase-admin'; // Ensure you have this

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const saleId = params.id;

  if (!saleId) {
    return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
  }

  try {
    const paymentData = await request.json();
    const { paymentAmount, paymentMethod, paymentDate, notes, details, staffId } = paymentData;

    // Basic validation
    if (typeof paymentAmount !== 'number' || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }
     if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required for payment record' }, { status: 400 });
    }

    const saleRef = doc(db, 'sales', saleId).withConverter(saleConverter);

    const updatedSaleData = await runTransaction(db, async (transaction) => {
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) {
            throw new Error('Sale not found');
        }

        const currentSale = saleDoc.data();
        
        const newPayment: Payment = {
            amount: paymentAmount,
            method: paymentMethod,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            notes: notes,
            details: details,
            staffId: staffId,
        };

        const newFirestorePayment: FirestorePayment = {
            ...newPayment,
            date: Timestamp.fromDate(newPayment.date)
        };

        const totalAmountPaid = (currentSale.totalAmountPaid || 0) + newPayment.amount;
        const outstandingBalance = currentSale.totalAmount - totalAmountPaid;

        const updatedData = {
            totalAmountPaid,
            outstandingBalance: outstandingBalance < 0 ? 0 : outstandingBalance, // Prevent negative balance
            additionalPayments: arrayUnion(newFirestorePayment),
            updatedAt: Timestamp.now()
        };
        
        transaction.update(saleRef, updatedData as any);

        const finalSaleState: Sale = {
            ...currentSale,
            totalAmountPaid: updatedData.totalAmountPaid,
            outstandingBalance: updatedData.outstandingBalance,
            additionalPayments: [...(currentSale.additionalPayments || []), newPayment]
        }
        return finalSaleState;
    });

    return NextResponse.json(updatedSaleData);

  } catch (error) {
    console.error(`Error adding payment to sale ${saleId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add payment', details: errorMessage }, { status: 500 });
  }
}
