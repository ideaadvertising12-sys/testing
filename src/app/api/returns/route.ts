
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { productConverter, saleConverter, type CartItem, type FirestoreCartItem, type Product } from '@/lib/types';

interface ReturnRequestBody {
  saleId: string;
  returnedItems: {
    id: string; // This is productId
    saleType: 'retail' | 'wholesale';
    quantity: number; // Quantity being returned in this transaction
    isResellable: boolean;
  }[];
  exchangedItems: {
    id: string;
    quantity: number;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { saleId, returnedItems, exchangedItems }: ReturnRequestBody = await request.json();

    if (!saleId || !returnedItems || !exchangedItems) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    await runTransaction(db, async (transaction) => {
      // 1. GATHER ALL REFS & PERFORM READS
      const saleRef = doc(db, 'sales', saleId).withConverter(saleConverter);
      
      const allProductIds = new Set([
        ...returnedItems.map(i => i.id),
        ...exchangedItems.map(i => i.id)
      ]);
      const productRefs = new Map<string, any>();
      allProductIds.forEach(id => {
        productRefs.set(id, doc(db, 'products', id).withConverter(productConverter));
      });

      const saleDoc = await transaction.get(saleRef);
      if (!saleDoc.exists()) {
        throw new Error(`Sale with ID ${saleId} not found.`);
      }

      const productDocs = await Promise.all(
        Array.from(productRefs.values()).map(ref => transaction.get(ref))
      );

      const productDataMap = new Map<string, { doc: Product, newStock: number }>();
      productDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          productDataMap.set(docSnap.id, { doc: data, newStock: data.stock });
        } else {
          const failedId = Array.from(productRefs.entries()).find(([, ref]) => ref.path === docSnap.ref.path)?.[0];
          throw new Error(`Product with ID ${failedId} not found.`);
        }
      });
      
      const currentSaleData = saleDoc.data();
      const newSaleItems = [...currentSaleData.items]; // Create a mutable copy

      // 2. VALIDATE & CALCULATE
      for (const item of exchangedItems) {
        const productInfo = productDataMap.get(item.id);
        if (!productInfo) {
          throw new Error(`Product with ID ${item.id} for exchange not found.`);
        }
        if (productInfo.newStock < item.quantity) {
          throw new Error(`Insufficient stock for ${productInfo.doc.name}. Available: ${productInfo.newStock}, Requested: ${item.quantity}`);
        }
        productInfo.newStock -= item.quantity;
      }

      for (const item of returnedItems) {
        if (item.isResellable) {
          const productInfo = productDataMap.get(item.id);
          if (!productInfo) {
            throw new Error(`Product with ID ${item.id} for return not found.`);
          }
          productInfo.newStock += item.quantity;
        }

        const saleItemIndex = newSaleItems.findIndex(
          saleItem => saleItem.id === item.id && saleItem.saleType === item.saleType
        );

        if (saleItemIndex === -1) {
          throw new Error(`Item with product ID ${item.id} and sale type ${item.saleType} not found in the original sale.`);
        }

        const originalSaleItem = newSaleItems[saleItemIndex];
        const alreadyReturned = originalSaleItem.returnedQuantity || 0;
        const potentialReturnQty = alreadyReturned + item.quantity;

        if (potentialReturnQty > originalSaleItem.quantity) {
          throw new Error(`Cannot return ${item.quantity} of ${originalSaleItem.name}. Only ${originalSaleItem.quantity - alreadyReturned} are available to be returned.`);
        }
        
        newSaleItems[saleItemIndex] = {
          ...originalSaleItem,
          returnedQuantity: potentialReturnQty
        };
      }

      // 3. PERFORM ALL WRITES
      productDataMap.forEach((info, id) => {
        const prodRef = productRefs.get(id);
        if (prodRef) {
          transaction.update(prodRef, { stock: info.newStock, updatedAt: Timestamp.now() });
        }
      });

      const firestoreSaleItems = newSaleItems.map((item: CartItem): FirestoreCartItem => {
        const firestoreItem: Partial<FirestoreCartItem> = {
            productRef: doc(db, 'products', item.id).path,
            quantity: item.quantity,
            appliedPrice: item.appliedPrice,
            saleType: item.saleType,
            productName: item.name, 
            productCategory: item.category,
            productPrice: item.price, 
            isOfferItem: item.isOfferItem || false,
            returnedQuantity: item.returnedQuantity || 0,
        };
        if (item.sku !== undefined) {
            firestoreItem.productSku = item.sku;
        }
        return firestoreItem as FirestoreCartItem;
      });

      transaction.update(saleRef, { items: firestoreSaleItems, updatedAt: Timestamp.now() });

    });

    return NextResponse.json({ message: 'Return/Exchange processed successfully and stock updated.' });

  } catch (error) {
    console.error('Error processing return/exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process return/exchange', details: errorMessage }, { status: 500 });
  }
}
