import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ExternalLink, X } from "lucide-react";

interface TrendingSearch {
  title: string;
  traffic: number;
  relatedQueries: string[];
}

export function TrendingSearches() {
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');

  const fetchTrendingProducts = async (queries: string[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL('/api/trending-products', window.location.origin);
      queries.forEach(q => url.searchParams.append('q', q));
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product searches');
      }
      
      console.log('Received data:', data);
      setTrendingSearches(data);
    } catch (error) {
      console.error('Error fetching product searches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product searches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery && !searchQueries.includes(currentQuery)) {
      const newQueries = [...searchQueries, currentQuery];
      setSearchQueries(newQueries);
      setCurrentQuery('');
      fetchTrendingProducts(newQueries);
    }
  };

  const handleRemoveQuery = (query: string) => {
    const newQueries = searchQueries.filter(q => q !== query);
    setSearchQueries(newQueries);
    fetchTrendingProducts(newQueries);
  };

  const handleClearAll = () => {
    setSearchQueries([]);
    setCurrentQuery('');
    setTrendingSearches([]);
  };

  const getGoogleTrendsUrl = (queries: string[]) => {
    const baseUrl = 'https://trends.google.com/trends/explore';
    const encodedQueries = queries.map(q => encodeURIComponent(q));
    return `${baseUrl}?q=${encodedQueries.join(',')}&geo=US`;
  };

  const maxTraffic = Math.max(...trendingSearches.map(search => search.traffic));

  return (
    <Card className="w-full max-w-3xl min-h-[300px] flex flex-col">
      <CardHeader>
        <CardTitle>Product Category Trends</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <form onSubmit={handleAddQuery} className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter any product category"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={!currentQuery}>Add</Button>
          </div>
        </form>
        {searchQueries.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center">
            {searchQueries.map((query, index) => (
              <Badge key={index} variant="secondary" className="mr-2 mb-2">
                {query}
                <button
                  onClick={() => handleRemoveQuery(query)}
                  className="ml-2 text-xs"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
            <Button variant="outline" size="sm" onClick={handleClearAll} className="mb-2">
              Clear All
            </Button>
          </div>
        )}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex-grow">
          {isLoading ? (
            <div>Loading...</div>
          ) : trendingSearches.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No product categories added yet.</p>
              <p>Enter any product category to see its trend data.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {trendingSearches.map((search, index) => (
                <li key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium flex items-center">
                      {search.title}
                      <button
                        onClick={() => handleRemoveQuery(search.title)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {search.traffic} (relative)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(search.traffic / maxTraffic) * 100}%` }}
                    ></div>
                  </div>
                  {search.relatedQueries && search.relatedQueries.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {search.relatedQueries.map((query, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary"
                          className="mr-2 mb-2 cursor-pointer hover:bg-secondary/80"
                        >
                          <a 
                            href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <span>{query}</span>
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        </Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {searchQueries.length > 0 && (
          <div className="mt-4">
            <a
              href={getGoogleTrendsUrl(searchQueries)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              View on Google Trends
              <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
