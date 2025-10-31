
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  doc, 
  runTransaction, 
  collection, 
  Timestamp, 
  increment,
  arrayUnion
} from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  saleConverter, 
  productConverter, 
  stockTransactionConverter, 
  returnTransactionConverter,
  type CartItem,
  type ChequeInfo,
  type BankTransferInfo,
  type Payment,
  type FirestorePayment,
  type StockTransaction,
  type ReturnTransaction
} from '@/lib/types';


interface ReturnRequestBody {
  saleId: string;
  returnedItems?: (CartItem & { isResellable: boolean })[];
  exchangedItems?: CartItem[];
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerShopName?: string;
  settleOutstandingAmount?: number;
  refundAmount?: number; // Credit added to account
  cashPaidOut?: number; // Cash given to customer
  payment?: {
    amountPaid: number;
    paymentSummary: string;
    changeGiven?: number;
    chequeDetails?: ChequeInfo;
    bankTransferDetails?: BankTransferInfo;
  }
  vehicleId?: string;
}

async function generateCustomReturnId(): Promise<string> {
    const today = new Date();
    const datePart = format(today, "yyMMdd");
    const counterRef = doc(db, "counters", "returns");
  
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists() || !counterDoc.data()?.count) {
        transaction.set(counterRef, { count: 1 });
        return 1;
      }
      const newCount = counterDoc.data().count + 1;
      transaction.update(counterRef, { count: newCount });
      return newCount;
    });
  
    return `RET-${datePart}-${String(newCount).padStart(4, '0')}`;
}


export async function POST(request: NextRequest) {
  try {
    const body: ReturnRequestBody = await request.json();
    const { 
        saleId, 
        staffId,
        customerId,
        customerName,
        customerShopName,
        settleOutstandingAmount,
        refundAmount,
        cashPaidOut,
        payment,
        vehicleId,
    } = body;
    
    const returnedItems = Array.isArray(body.returnedItems) ? body.returnedItems : [];
    const exchangedItems = Array.isArray(body.exchangedItems) ? body.exchangedItems : [];

    if (!saleId || !staffId) {
      return NextResponse.json({ error: 'Invalid request body. Missing required fields.' }, { status: 400 });
    }
     if (returnedItems.length === 0 && exchangedItems.length === 0 && !refundAmount && !cashPaidOut && !settleOutstandingAmount) {
      return NextResponse.json({ error: 'Cannot process an empty transaction with no financial impact.' }, { status: 400 });
    }

    const returnId = await generateCustomReturnId();
    let finalReturnData: ReturnTransaction | null = null;
  
    await runTransaction(db, async (transaction) => {
      // 1. READ ORIGINAL SALE
      const saleRef = doc(db, 'sales', saleId).withConverter(saleConverter);
      const saleDoc = await transaction.get(saleRef);
      if (!saleDoc.exists()) {
        throw new Error(`Sale with ID ${saleId} not found.`);
      }
      const currentSaleData = saleDoc.data();

      // 2. SETTLE OUTSTANDING BALANCE IF APPLICABLE
      if (settleOutstandingAmount && settleOutstandingAmount > 0) {
        if (currentSaleData.outstandingBalance < settleOutstandingAmount) {
          throw new Error(`Cannot settle ${settleOutstandingAmount}. Outstanding balance is only ${currentSaleData.outstandingBalance}.`);
        }
        const creditPayment: Payment = {
          amount: settleOutstandingAmount,
          method: 'ReturnCredit',
          date: new Date(),
          staffId: staffId,
          notes: `Credit from Return ID: ${returnId}`
        };
        
        const firestorePayment: FirestorePayment = { ...creditPayment, date: Timestamp.fromDate(creditPayment.date) };
        transaction.update(saleRef, {
          outstandingBalance: increment(-settleOutstandingAmount),
          totalAmountPaid: increment(settleOutstandingAmount),
          additionalPayments: arrayUnion(firestorePayment)
        });
      }

      // 3. HANDLE STOCK & SALE ITEM UPDATES
      const newSaleItems = [...currentSaleData.items];
      
      // Handle exchanged items (stock out)
      for (const item of exchangedItems) {
        const productRef = doc(db, 'products', item.id);
        if (!vehicleId) { // Main inventory exchange
          transaction.update(productRef, { stock: increment(-item.quantity) });
        } else { // Vehicle exchange
          const stockTx: Omit<StockTransaction, 'id'> = {
            productId: item.id, productName: item.name, productSku: item.sku,
            type: 'UNLOAD_FROM_VEHICLE', quantity: item.quantity,
            previousStock: -1, newStock: -1, // Not tracked directly here; relies on aggregate
            transactionDate: new Date(), notes: `Exchange in Return: ${returnId}`,
            vehicleId, userId: staffId,
          };
          const txDocRef = doc(collection(db, "stockTransactions"));
          transaction.set(txDocRef, stockTransactionConverter.toFirestore({id: 'temp', ...stockTx}));
        }
      }

      // Handle returned items (stock in)
      for (const item of returnedItems) {
        if (item.isResellable) {
          const productRef = doc(db, 'products', item.id);
          if (vehicleId) { // Return to vehicle
            const stockTx: Omit<StockTransaction, 'id'> = {
              productId: item.id, productName: item.name, productSku: item.sku,
              type: 'LOAD_TO_VEHICLE', quantity: item.quantity,
              previousStock: -1, newStock: -1, // Not tracked directly here
              transactionDate: new Date(), notes: `Resellable return to vehicle. Return ID: ${returnId}`,
              vehicleId, userId: staffId,
            };
            const txDocRef = doc(collection(db, "stockTransactions"));
            transaction.set(txDocRef, stockTransactionConverter.toFirestore({id: 'temp', ...stockTx}));
          } else { // Return to main inventory
            transaction.update(productRef, { stock: increment(item.quantity) });
          }
        }
        
        const saleItemIndex = newSaleItems.findIndex(si => si.id === item.id && si.saleType === item.saleType);
        if (saleItemIndex === -1) throw new Error(`Item ${item.name} not found in original sale.`);
        
        const originalSaleItem = newSaleItems[saleItemIndex];
        const alreadyReturned = originalSaleItem.returnedQuantity || 0;
        if ((alreadyReturned + item.quantity) > originalSaleItem.quantity) {
          throw new Error(`Cannot return ${item.quantity} of ${originalSaleItem.name}. Already returned: ${alreadyReturned}, Max: ${originalSaleItem.quantity}`);
        }
        newSaleItems[saleItemIndex] = { ...originalSaleItem, returnedQuantity: alreadyReturned + item.quantity };
      }
      
      // 4. WRITE UPDATED SALE AND NEW RETURN DOCUMENT
      transaction.update(saleRef, {
        items: newSaleItems,
        updatedAt: Timestamp.now(),
      });

      const returnDocRef = doc(db, 'returns', returnId);
      
      finalReturnData = {
        id: returnId,
        originalSaleId: saleId, returnDate: new Date(), staffId, customerId, customerName,
        customerShopName, returnedItems: returnedItems, exchangedItems: exchangedItems,
        settleOutstandingAmount, refundAmount, cashPaidOut, ...payment
      };

      transaction.set(returnDocRef, returnTransactionConverter.toFirestore(finalReturnData));
    });

    if (!finalReturnData) {
        throw new Error("Transaction failed and return data could not be constructed.");
    }
    
    return NextResponse.json({ 
        message: 'Return/Exchange processed successfully and stock updated.', 
        returnId,
        returnData: finalReturnData
    });

  } catch (error) {
    console.error('Error processing return/exchange:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process return/exchange', details: errorMessage }, { status: 500 });
  }
}
