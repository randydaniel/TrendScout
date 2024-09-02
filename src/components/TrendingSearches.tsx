import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ExternalLink, X, Plus, Check } from "lucide-react";

interface TrendingSearch {
  title: string;
  traffic: number;
  relatedQueries: string[];
}

export function TrendingSearches() {
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [userSearches, setUserSearches] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trending-products');
      const data = await response.json();
      
      console.log('Raw API response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product searches');
      }
      
      // Ensure the data is in the expected format
      const formattedData = data.trends.map((item: any) => {
        try {
          return {
            title: item.title || 'Unknown',
            traffic: item.traffic || 0,
            relatedQueries: Array.isArray(item.relatedQueries) 
              ? item.relatedQueries.map((q: any) => q.rankedKeyword || '').filter(Boolean)
              : []
          };
        } catch (err) {
          console.error('Error processing item:', item, err);
          return null;
        }
      }).filter(Boolean);
      
      console.log('Formatted data:', formattedData);
      
      setTrendingSearches(formattedData);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching product searches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product searches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery && !searchQueries.includes(currentQuery)) {
      setSearchQueries([...searchQueries, currentQuery]);
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/trending-products?q=${encodeURIComponent(currentQuery)}`);
        const data = await response.json();
        
        console.log('Raw API response for user query:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product search');
        }
        
        const formattedData = data.map((item: any) => {
          try {
            return {
              title: item.title || currentQuery,
              traffic: item.traffic || 0,
              relatedQueries: Array.isArray(item.relatedQueries) 
                ? item.relatedQueries.map((q: any) => q.rankedKeyword || '').filter(Boolean)
                : []
            };
          } catch (err) {
            console.error('Error processing item:', item, err);
            return null;
          }
        }).filter(Boolean);
        
        console.log('Formatted data for user query:', formattedData);
        
        setUserSearches([...userSearches, ...formattedData]);
      } catch (error) {
        console.error('Error fetching product search:', error);
        // If there's an error, add a default item
        setUserSearches([...userSearches, {
          title: currentQuery,
          traffic: 0,
          relatedQueries: []
        }]);
      } finally {
        setIsLoading(false);
      }
      
      setCurrentQuery('');
    }
  };

  const handleRemoveQuery = (query: string) => {
    setSearchQueries(searchQueries.filter(q => q !== query));
    setUserSearches(userSearches.filter(search => search.title !== query));
  };

  const handleToggleTrendingQuery = (query: string) => {
    if (searchQueries.includes(query)) {
      setSearchQueries(searchQueries.filter(q => q !== query));
    } else {
      setSearchQueries([...searchQueries, query]);
    }
  };

  const getGoogleTrendsUrl = (queries: string[]) => {
    const baseUrl = 'https://trends.google.com/trends/explore';
    const encodedQueries = queries.map(q => encodeURIComponent(q));
    return `${baseUrl}?q=${encodedQueries.join(',')}&geo=US`;
  };

  const allSearches = [...trendingSearches, ...userSearches];
  const maxTraffic = Math.max(...allSearches.map(search => search.traffic));

  return (
    <Card className="w-full max-w-3xl flex flex-col">
      <CardHeader>
        <CardTitle>Product Category Trends</CardTitle>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <form onSubmit={handleAddQuery} className="mb-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter any product term or category"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={!currentQuery}>Add</Button>
          </div>
        </form>

        {trendingSearches.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Trending Now:</p>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`cursor-pointer transition-colors duration-200 ${
                    searchQueries.includes(search.title)
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => handleToggleTrendingQuery(search.title)}
                >
                  {searchQueries.includes(search.title) ? (
                    <Check size={14} className="mr-1" />
                  ) : (
                    <Plus size={14} className="mr-1" />
                  )}
                  {search.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            {allSearches
              .filter(search => searchQueries.includes(search.title))
              .map((search, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-grow">
                          <button
                            onClick={() => handleRemoveQuery(search.title)}
                            className="text-gray-500 hover:text-gray-700 mr-2"
                          >
                            <X size={16} />
                          </button>
                          <span className="font-medium text-lg">{search.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{search.traffic}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-slate-900 rounded-full h-1.5"
                              style={{ width: `${(search.traffic / maxTraffic) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {searchQueries.length > 0 && (
          <Button
            className="w-full rounded-lg mt-4"
            variant="outline"
            onClick={() => window.open(getGoogleTrendsUrl(searchQueries), '_blank')}
          >
            View on Google Trends
            <ExternalLink size={14} className="ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
