
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { productConverter, type Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q')?.toLowerCase();
  const category = searchParams.get('category');
  const ids = searchParams.get('ids')?.split(',');
  const searchLimit = 50;

  try {
    const productsCol = collection(db, 'products').withConverter(productConverter);
    
    let q;
    
    if (ids && ids.length > 0) {
      // Fetch specific products by ID, up to 30 as per 'in' query limit
      q = query(productsCol, where('__name__', 'in', ids.slice(0, 30)));
    } else {
      const constraints = [];
      if (searchTerm) {
        constraints.push(where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      }
      if (category) {
        constraints.push(where('category', '==', category));
      }
      constraints.push(limit(searchLimit));
      q = query(productsCol, ...constraints as any);
    }

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => doc.data());
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error searching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to search for products', details: errorMessage }, { status: 500 });
  }
}

    