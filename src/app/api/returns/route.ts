
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { productConverter } from '@/lib/types';

interface ReturnedItem {
  id: string;
  quantity: number;
  isResellable: boolean;
}

interface ExchangedItem {
  id: string;
  quantity: number;
}

interface ReturnRequestBody {
  returnedItems: ReturnedItem[];
  exchangedItems: ExchangedItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { returnedItems, exchangedItems }: ReturnRequestBody = await request.json();

    if (!returnedItems || !exchangedItems) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    await runTransaction(db, async (transaction) => {
      // 1. Gather all unique product references and perform all reads first.
      const allItemIds = new Set([...returnedItems.map(i => i.id), ...exchangedItems.map(i => i.id)]);
      const allItemRefs = new Map<string, any>();
      
      allItemIds.forEach(id => {
        allItemRefs.set(id, doc(db, 'products', id).withConverter(productConverter));
      });

      const productDocs = await Promise.all(
        Array.from(allItemRefs.values()).map(ref => transaction.get(ref))
      );

      const productDataMap = new Map<string, { doc: any; newStock: number }>();
      productDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          productDataMap.set(docSnap.id, { doc: data, newStock: data.stock });
        } else {
            // Find which item caused the failure
            const failedId = Array.from(allItemRefs.entries()).find(([id, ref]) => ref.path === docSnap.ref.path)?.[0];
            throw new Error(`Product with ID ${failedId} not found.`);
        }
      });

      // 2. Perform validation and calculations based on the read data.
      
      // First, process items being taken by the customer (stock out).
      for (const item of exchangedItems) {
        const productInfo = productDataMap.get(item.id);
        if (!productInfo) {
          throw new Error(`Product with ID ${item.id} not found.`);
        }
        if (productInfo.newStock < item.quantity) {
          throw new Error(`Insufficient stock for ${productInfo.doc.name}. Available: ${productInfo.newStock}, Requested: ${item.quantity}`);
        }
        // Update the new stock value in our map.
        productInfo.newStock -= item.quantity;
      }

      // Second, process items being returned by the customer (stock in).
      for (const item of returnedItems) {
        const productInfo = productDataMap.get(item.id);
        if (!productInfo) {
          throw new Error(`Product with ID ${item.id} not found for return.`);
        }
        // Only add stock back if the item is marked as resellable.
        if (item.isResellable) {
            productInfo.newStock += item.quantity;
        }
      }

      // 3. Perform all writes at the end.
      productDataMap.forEach((info, id) => {
        const productRef = allItemRefs.get(id);
        if (productRef) {
          // Write the final calculated stock level.
          transaction.update(productRef, { stock: info.newStock });
        }
      });
    });

    return NextResponse.json({ message: 'Exchange processed successfully and stock updated.' });

  } catch (error) {
    console.error('Error processing exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process exchange', details: errorMessage }, { status: 500 });
  }
}
