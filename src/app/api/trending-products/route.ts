import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

const SERP_API_KEY = process.env.SERP_API_KEY;

interface TrendingProduct {
  title: string;
  traffic: number;
  relatedQueries: string[];
  timelineData: { date: string; value: number }[];
}

// Simple rate limiting
const rateLimit = new LRUCache({
  max: 100,
  ttl: 60000, // 1 minute
});

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const currentRequests = rateLimit.get(ip) as number | undefined;

    if (currentRequests !== undefined && currentRequests > 10) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    rateLimit.set(ip, (currentRequests || 0) + 1);

    const { searchParams } = new URL(request.url);
    const queries = searchParams.getAll('q');

    console.log('Received queries:', queries);

    let trendingProducts: TrendingProduct[] = [];

    if (queries.length > 0) {
      trendingProducts = await Promise.all(queries.map(fetchProductData));
    } else {
      trendingProducts = await fetchTrendingSearches();
    }

    console.log('Returning product trends:', trendingProducts);

    return NextResponse.json({
      trends: trendingProducts,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product searches', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function fetchProductData(query: string): Promise<TrendingProduct> {
  // Fetch related queries
  const relatedQueriesResponse = await fetch(`https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&data_type=RELATED_QUERIES&geo=US&api_key=${SERP_API_KEY}`);
  
  if (!relatedQueriesResponse.ok) {
    throw new Error(`SerpAPI request failed with status ${relatedQueriesResponse.status}`);
  }

  const relatedQueriesData = await relatedQueriesResponse.json();

  // Fetch timeline data
  const timelineResponse = await fetch(`https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&data_type=TIMESERIES&geo=US&api_key=${SERP_API_KEY}`);

  if (!timelineResponse.ok) {
    throw new Error(`SerpAPI request failed with status ${timelineResponse.status}`);
  }

  const timelineData = await timelineResponse.json();

  console.log('SerpAPI responses:', { relatedQueriesData, timelineData });

  if (relatedQueriesData.error || timelineData.error) {
    console.error('SerpAPI error:', relatedQueriesData.error || timelineData.error);
    throw new Error(relatedQueriesData.error || timelineData.error);
  }

  return {
    title: query,
    traffic: timelineData.interest_over_time?.timeline_data?.[timelineData.interest_over_time.timeline_data.length - 1]?.values?.[0]?.value ?? 0,
    relatedQueries: (relatedQueriesData.related_queries?.top as { query: string }[] | undefined)?.map(q => q.query).slice(0, 3) ?? [],
    timelineData: timelineData.interest_over_time?.timeline_data?.map((item: { date: string; values: { value: number }[] }) => ({
      date: item.date,
      value: item.values[0].value
    })) ?? []
  };
}

async function fetchTrendingSearches(): Promise<TrendingProduct[]> {
  const response = await fetch(`https://serpapi.com/search.json?engine=google_trends_trending_now&frequency=daily&geo=US&api_key=${SERP_API_KEY}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    console.error('SerpAPI error:', data.error);
    throw new Error(data.error);
  }

  return data.daily_searches?.[0]?.searches?.map((search: {
    query: string;
    traffic: number;
    related_queries?: { query: string }[];
  }) => ({
    title: search.query,
    traffic: search.traffic,
    relatedQueries: search.related_queries?.map(q => q.query) ?? [],
    timelineData: []
  })) ?? [];
}