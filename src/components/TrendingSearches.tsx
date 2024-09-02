import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ExternalLink, X, Plus, Check, ChevronUp, ChevronDown } from "lucide-react";

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
  const [currentQuery, setCurrentQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const fetchTrendingProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trending-products');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product searches');
      }
      
      setTrendingSearches(data.trends);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching product searches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product searches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingProducts();
  }, [fetchTrendingProducts]);

  const addQuery = async (query: string) => {
    if (userSearches.some(search => search.title === query)) {
      return; // If the query already exists, don't add it again
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/trending-products?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product search');
      }
      
      const newSearch = data.trends[0];
      setUserSearches(prev => [...prev, newSearch]);
    } catch (error) {
      console.error('Error fetching product search:', error);
      setUserSearches(prev => [...prev, {
        title: query,
        traffic: 0,
        relatedQueries: []
      }]);
    } finally {
      setIsLoading(false);
    }
    
    setCurrentQuery('');
  };

  const handleAddQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery) {
      await addQuery(currentQuery);
    }
  };

  const handleRemoveQuery = (query: string) => {
    setUserSearches(prev => prev.filter(search => search.title !== query));
  };

  const handleToggleTrendingQuery = (query: string) => {
    if (userSearches.some(search => search.title === query)) {
      handleRemoveQuery(query);
    } else {
      addQuery(query);
    }
  };

  const handleToggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    );
  };

  const getGoogleTrendsUrl = (queries: string[]) => {
    const baseUrl = 'https://trends.google.com/trends/explore';
    const encodedQueries = queries.map(q => encodeURIComponent(q));
    return `${baseUrl}?q=${encodedQueries.join(',')}&geo=US`;
  };

  const maxTraffic = Math.max(...userSearches.map(search => search.traffic));

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
                    userSearches.some(s => s.title === search.title)
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => handleToggleTrendingQuery(search.title)}
                >
                  {userSearches.some(s => s.title === search.title) ? (
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
            {userSearches.map((search, index) => (
              <Card key={index} className="p-4">
                <CardContent className="p-0">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-grow">
                        <button
                          onClick={() => handleToggleExpand(search.title)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedItems.includes(search.title) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
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
                        <button
                          onClick={() => handleRemoveQuery(search.title)}
                          className="text-gray-500 hover:text-gray-700 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {expandedItems.includes(search.title) && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Related Queries:</p>
                        <div className="flex flex-wrap gap-2">
                          {search.relatedQueries.map((query, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => addQuery(query)}
                            >
                              {userSearches.some(s => s.title === query) ? (
                                <Check size={12} className="mr-1" />
                              ) : (
                                <Plus size={12} className="mr-1" />
                              )}
                              {query}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {userSearches.length > 0 && (
          <Button
            className="w-full rounded-lg mt-6"
            variant="outline"
            onClick={() => window.open(getGoogleTrendsUrl(userSearches.map(s => s.title)), '_blank')}
          >
            View on Google Trends
            <ExternalLink size={14} className="ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
