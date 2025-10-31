
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { returnTransactionConverter, saleConverter } from '@/lib/types';

async function calculateAvailableCredit(customerId: string): Promise<number> {
    const salesQuery = query(
        collection(db, 'sales'), 
        where('customerId', '==', customerId)
    );
    const returnsQuery = query(
        collection(db, 'returns'), 
        where('customerId', '==', customerId)
    );

    const [salesSnapshot, returnsSnapshot] = await Promise.all([
        getDocs(salesQuery.withConverter(saleConverter)),
        getDocs(returnsQuery.withConverter(returnTransactionConverter))
    ]);

    // Credit added to a customer's account from a return is a positive value in refundAmount
    const totalRefundsNet = returnsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().refundAmount || 0), 0);
    
    // Credit used in a sale is a debit from their credit pool
    const totalCreditUsedOnSales = salesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().creditUsed || 0), 0);
    
    return totalRefundsNet - totalCreditUsedOnSales;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('id');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    const availableCredit = await calculateAvailableCredit(customerId);
    return NextResponse.json({ customerId, availableCredit });
  } catch (error) {
    console.error(`Error calculating credit for customer ${customerId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to calculate available credit', details: errorMessage }, { status: 500 });
  }
}
