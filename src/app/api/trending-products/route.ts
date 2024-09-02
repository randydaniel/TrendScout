import { NextResponse } from 'next/server';

interface TrendingProduct {
  title: string;
  traffic: number;
  relatedQueries: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queries = searchParams.getAll('q');

  console.log('Received queries:', queries);

  try {
    let trendingProducts: TrendingProduct[] = [];

    if (queries.length > 0) {
      trendingProducts = queries.map(query => ({
        title: query,
        traffic: Math.floor(Math.random() * 100) + 1, // Random traffic between 1 and 100
        relatedQueries: [
          `${query} brands`,
          `Best ${query}`,
          `${query} reviews`,
          `Cheap ${query}`,
          `${query} comparison`
        ].sort(() => 0.5 - Math.random()).slice(0, 3) // Randomly select 3 related queries
      }));

      // Sort by traffic in descending order
      trendingProducts.sort((a, b) => b.traffic - a.traffic);
    }

    console.log('Returning product trends:', trendingProducts);

    return NextResponse.json(trendingProducts);
  } catch (error) {
    console.error('Error fetching product searches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error fetching product searches', details: errorMessage }, { status: 500 });
  }
}
