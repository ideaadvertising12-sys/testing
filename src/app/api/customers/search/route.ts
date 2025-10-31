
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { customerConverter, type Customer } from '@/lib/types';

// Cache the API response for 60 seconds to reduce reads for frequent, identical searches
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q');
  const searchLimit = 10;

  if (!searchTerm || searchTerm.length < 2) {
    return NextResponse.json({ error: 'A search term of at least 2 characters is required' }, { status: 400 });
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const isNumeric = /^\d+$/.test(searchTerm);
  
  try {
    const customersCol = collection(db, 'customers').withConverter(customerConverter);
    
    // --- START: Optimized Query Logic ---
    const queries = [];

    if (isNumeric) {
      // If the search term is purely numeric, it's most likely a phone number.
      // Only query the phone field.
      const phoneQuery = query(
          customersCol,
          where('phone', '>=', lowerCaseSearchTerm),
          where('phone', '<=', lowerCaseSearchTerm + '\uf8ff'),
          limit(searchLimit)
      );
      queries.push(getDocs(phoneQuery));

    } else {
      // If it's not numeric, it's a name or shop name.
      // Query only the text-based fields.
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
      queries.push(getDocs(nameQuery), getDocs(shopNameQuery));
    }
    // --- END: Optimized Query Logic ---


    const querySnapshots = await Promise.all(queries);

    const customersMap = new Map<string, Customer>();

    querySnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            if(doc.data().status !== 'pending') customersMap.set(doc.id, doc.data());
        });
    });
    
    const results = Array.from(customersMap.values());
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to search for customers', details: errorMessage }, { status: 500 });
  }
}

    