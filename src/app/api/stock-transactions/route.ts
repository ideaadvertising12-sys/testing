
import { NextResponse, type NextRequest } from 'next/server';
import { StockService } from '@/lib/stockService';

// GET /api/stock-transactions?vehicleId=<vehicleId>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId query parameter is required' }, { status: 400 });
  }

  try {
    const transactions = await StockService.getTransactionsByVehicleId(vehicleId);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error(`Error fetching stock transactions for vehicle ${vehicleId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch stock transactions', details: errorMessage }, { status: 500 });
  }
}
