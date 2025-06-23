
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { productConverter } from '@/lib/types';

interface ReturnRequestItem {
  id: string;
  quantity: number;
}

interface ReturnRequestBody {
  returnedItems: ReturnRequestItem[];
  exchangedItems: ReturnRequestItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { returnedItems, exchangedItems }: ReturnRequestBody = await request.json();

    if (!returnedItems || !exchangedItems) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    await runTransaction(db, async (transaction) => {
      // Process items being taken by the customer (stock out)
      for (const item of exchangedItems) {
        const productRef = doc(db, 'products', item.id).withConverter(productConverter);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }

        const currentStock = productDoc.data().stock;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${productDoc.data().name}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }

        const newStock = currentStock - item.quantity;
        transaction.update(productRef, { stock: newStock });
      }

      // Process items being returned by the customer (stock in)
      // Assuming all returned items are resellable for now.
      for (const item of returnedItems) {
        const productRef = doc(db, 'products', item.id).withConverter(productConverter);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          // This should ideally not happen if the item was on the original invoice
          throw new Error(`Product with ID ${item.id} not found for return.`);
        }

        const newStock = productDoc.data().stock + item.quantity;
        transaction.update(productRef, { stock: newStock });
      }
    });

    return NextResponse.json({ message: 'Exchange processed successfully and stock updated.' });

  } catch (error) {
    console.error('Error processing exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process exchange', details: errorMessage }, { status: 500 });
  }
}

    