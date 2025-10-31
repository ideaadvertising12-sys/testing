
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { customerConverter, type Customer } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q');
  const searchLimit = 10;

  if (!searchTerm || searchTerm.length < 2) {
    return NextResponse.json({ error: 'A search term of at least 2 characters is required' }, { status: 400 });
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  
  try {
    const customersCol = collection(db, 'customers').withConverter(customerConverter);
    
    // As Firestore doesn't support case-insensitive `in` or `array-contains-any` for this kind of search,
    // and full-text search is a more complex setup (e.g., with Algolia/Typesense),
    // we'll perform a few targeted queries and merge the results. This is more efficient than reading all documents.

    const nameQuery = query(
        customersCol, 
        where('name_lowercase', '>=', lowerCaseSearchTerm),
        where('name_lowercase', '<=', lowerCaseSearchTerm + '\uf8ff'),
        limit(searchLimit)
    );
    const shopNameQuery = query(
        customersCol,
        where('shopName_lowercase', '>=', lowerCaseSearchTerm),
        where('shopName_lowercase', '<=', lowerCaseSearchTerm + '\uf8ff'),
        limit(searchLimit)
    );
    const phoneQuery = query(
        customersCol,
        where('phone', '>=', lowerCaseSearchTerm),
        where('phone', '<=', lowerCaseSearchTerm + '\uf8ff'),
        limit(searchLimit)
    );

    const [nameSnapshot, shopNameSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(shopNameQuery),
        getDocs(phoneQuery),
    ]);

    const customersMap = new Map<string, Customer>();

    nameSnapshot.docs.forEach(doc => {
      if(doc.data().status !== 'pending') customersMap.set(doc.id, doc.data());
    });
    shopNameSnapshot.docs.forEach(doc => {
        if(doc.data().status !== 'pending') customersMap.set(doc.id, doc.data());
    });
    phoneSnapshot.docs.forEach(doc => {
        if(doc.data().status !== 'pending') customersMap.set(doc.id, doc.data());
    });

    const results = Array.from(customersMap.values());
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to search for customers', details: errorMessage }, { status: 500 });
  }
}
