import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ExternalLink, X, Plus, Check, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/src/components/ui/chart";

const MAX_QUERIES = 5;

interface TrendingSearch {
  title: string;
  traffic: number;
  relatedQueries: string[];
  timelineData: { date: string; value: number }[];
}

interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
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
      
      console.log('API response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
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

  const handleAddQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentQuery && userSearches.length < MAX_QUERIES) {
      await addQuery(currentQuery);
    }
  };

  const addQuery = async (query: string, retries = 3) => {
    if (userSearches.some(search => search.title === query) || userSearches.length >= MAX_QUERIES) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trending-products?q=${encodeURIComponent(query)}`);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(text || 'Failed to fetch product search');
      }
      
      console.log('API response for query:', query, data);
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      const newSearch = data.trends[0];
      setUserSearches(prev => [...prev, newSearch]);
    } catch (error) {
      console.error('Error fetching product search:', error);
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        return addQuery(query, retries - 1);
      }
      setError(error instanceof Error ? error.message : 'Failed to add search');
    } finally {
      setIsLoading(false);
    }
    setCurrentQuery('');
  };

  const handleRemoveQuery = (query: string) => {
    setUserSearches(prev => prev.filter(search => search.title !== query));
  };

  const handleToggleTrendingQuery = (query: string) => {
    if (userSearches.some(search => search.title === query)) {
      handleRemoveQuery(query);
    } else if (userSearches.length < MAX_QUERIES) {
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

  const chartData = useMemo(() => {
    if (userSearches.length === 0 || !userSearches[0].timelineData) {
      return [];
    }
    const maxValue = Math.max(...userSearches.flatMap(search => 
      search.timelineData?.map(item => item.value) ?? []
    ));
    return userSearches[0].timelineData.map((item, index) => {
      const dataPoint: { [key: string]: string | number } = { date: item.date };
      userSearches.forEach(search => {
        if (search.timelineData && search.timelineData[index]) {
          // Scale the value to 0-100 range
          dataPoint[search.title] = (search.timelineData[index].value / maxValue) * 100 || 0;
        } else {
          dataPoint[search.title] = 0;
        }
      });
      return dataPoint;
    });
  }, [userSearches]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return {
      ...userSearches.reduce<ChartConfig>((acc, search, index) => {
        const hue = (index * 137.5) % 360;
        acc[search.title] = {
          label: search.title,
          color: `hsl(${hue}, 70%, 50%)`,
        };
        return acc;
      }, {}),
      chart: {
        label: 'Chart',
        color: 'transparent',
      },
    };
  }, [userSearches]);

  const maxTraffic = Math.max(...userSearches.map(search => search.traffic));

  console.log('userSearches:', userSearches); // Add this line for debugging

  const renderBadge = (query: string, isRelated: boolean = false) => {
    const isSelected = userSearches.some(s => s.title === query);
    const canAdd = userSearches.length < MAX_QUERIES;

    return (
      <Badge
        key={query}
        variant={isRelated ? "secondary" : "outline"}
        className={`cursor-pointer transition-colors duration-200 ${
          isSelected
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'hover:bg-slate-100'
        }`}
        onClick={() => handleToggleTrendingQuery(query)}
      >
        {isSelected ? (
          <Check size={isRelated ? 12 : 14} className="mr-1" />
        ) : canAdd ? (
          <Plus size={isRelated ? 12 : 14} className="mr-1" />
        ) : null}
        {query}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-3xl flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Trend Scout</span>
        </CardTitle>
        <p className="text-sm text-slate-500 tracking-tight">Your Google Trends Analysis Tool</p>
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
            <Button 
              type="submit" 
              disabled={!currentQuery || isLoading || userSearches.length >= MAX_QUERIES}
            >
              Add
            </Button>
          </div>
        </form>

        {userSearches.length >= MAX_QUERIES && (
          <p className="text-sm text-red-500">
            You&apos;ve reached the maximum number of queries ({MAX_QUERIES}).
          </p>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {trendingSearches.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Trending Now</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search) => renderBadge(search.title))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw size={24} className="animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {userSearches.map((search, index) => {
              console.log('Search data:', search);
              return (
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
                          {search.relatedQueries && search.relatedQueries.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {search.relatedQueries.map((query) => renderBadge(query, true))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No related queries found.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {userSearches.length > 0 && chartData.length > 0 && (
          <div className="mt-4 h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                <RefreshCw size={24} className="animate-spin text-slate-500" />
              </div>
            )}
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {userSearches.map((search) => (
                    <Line
                      key={search.title}
                      type="monotone"
                      dataKey={search.title}
                      stroke={chartConfig[search.title].color}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
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
