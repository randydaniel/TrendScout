import { NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

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
      // Fetch Google Trends data for each query
      const trendsPromises = queries.map(async (query) => {
        const result = await googleTrends.interestOverTime({ keyword: query, geo: 'US' });
        const data = JSON.parse(result);
        const timelineData = data.default.timelineData;
        const latestPoint = timelineData[timelineData.length - 1];
        return {
          title: query,
          traffic: latestPoint.value[0],
          relatedQueries: await fetchRelatedQueries(query)
        };
      });

      trendingProducts = await Promise.all(trendsPromises);
    } else {
      // If no queries provided, fetch overall trending searches
      const trendingSearches = await fetchTrendingSearches();
      trendingProducts = await Promise.all(trendingSearches.map(async (search) => ({
        title: search,
        traffic: 100, // Default value as we don't have specific traffic data
        relatedQueries: await fetchRelatedQueries(search)
      })));
    }

    // Sort by traffic in descending order
    trendingProducts.sort((a, b) => b.traffic - a.traffic);

    console.log('Returning product trends:', trendingProducts);

    return NextResponse.json(trendingProducts);
  } catch (error) {
    console.error('Error fetching product searches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error fetching product searches', details: errorMessage }, { status: 500 });
  }
}

async function fetchRelatedQueries(query: string): Promise<string[]> {
  try {
    const result = await googleTrends.relatedQueries({ keyword: query, geo: 'US' });
    const data = JSON.parse(result);
    
    console.log(`Data structure for query "${query}":`, JSON.stringify(data, null, 2));

    if (data && data.default && data.default.rankedList && Array.isArray(data.default.rankedList)) {
      const relatedQueries = data.default.rankedList
        .flatMap((list: any) => list.rankedKeyword || [])
        .map((item: any) => item.query || '')
        .filter(Boolean)
        .slice(0, 3);

      if (relatedQueries.length > 0) {
        return relatedQueries;
      }
    }

    console.warn(`No related queries found for: ${query}`);
    // Fallback: Generate some generic related queries
    return generateGenericRelatedQueries(query);
  } catch (error) {
    console.error('Error fetching related queries:', error);
    return generateGenericRelatedQueries(query);
  }
}

function generateGenericRelatedQueries(query: string): string[] {
  const genericQueries = [
    `${query} near me`,
    `${query} price`,
    `${query} reviews`,
    `best ${query}`,
    `${query} how to`,
    `${query} vs`,
  ];
  
  // Shuffle the array and return the first 3 items
  return genericQueries.sort(() => 0.5 - Math.random()).slice(0, 3);
}

async function fetchTrendingSearches(): Promise<string[]> {
  try {
    const result = await googleTrends.dailyTrends({ geo: 'US' });
    const data = JSON.parse(result);
    return data.default.trendingSearchesDays[0].trendingSearches
      .slice(0, 5)
      .map((trend: any) => trend.title.query);
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    return [];
  }
}