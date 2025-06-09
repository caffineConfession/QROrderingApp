
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { Calendar as CalendarIcon, BarChart3, TrendingUp, ShoppingCart, DollarSign, AlertCircle, Package, Star, MessageSquare, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import StarRatingInput from '@/components/StarRatingInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from "@/components/ui/skeleton";

import { getAnalyticsPageData, type AnalyticsPageData, type ExperienceComment, type ProductComment, type DailySalesData } from './actions';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
};

const chartConfig = {
  sales: {
    label: "Sales (₹)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function CommentCard({ comment, type }: { comment: ExperienceComment | ProductComment; type: 'overall' | 'product' }) {
  return (
    <div className="p-3 border rounded-lg bg-muted/30 space-y-1.5 text-sm">
      <div className="flex justify-between items-center">
        <span className="font-medium text-xs text-muted-foreground">
          {comment.customerName || 'Anonymous'} - {new Date(comment.createdAt).toLocaleDateString()}
        </span>
        <StarRatingInput value={comment.rating} onChange={() => {}} size={14} disabled />
      </div>
      {type === 'product' && 'productName' in comment && (
        <p className="font-semibold text-primary">{(comment as ProductComment).productName}</p>
      )}
      <p className="text-foreground leading-relaxed">{comment.comment || <span className="italic text-muted-foreground">No comment provided.</span>}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-3 h-6 w-6 text-primary" /> Business Analytics Overview
            </CardTitle>
            <Skeleton className="h-10 w-64" /> {/* Date Picker Skeleton */}
          </div>
          <CardDescription>
            Key metrics, performance insights, and customer feedback for Caffico Express.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" /> <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent> <Skeleton className="h-8 w-24 mt-1" /> <Skeleton className="h-4 w-20 mt-1" /> </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent className="h-[350px] w-full p-2"><Skeleton className="h-full w-full" /></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}


export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined); // Initialize as undefined
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (currentDateRange?: DateRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const rangeToFetch = currentDateRange?.from && currentDateRange?.to
        ? { from: format(currentDateRange.from, 'yyyy-MM-dd'), to: format(currentDateRange.to, 'yyyy-MM-dd') }
        : undefined; // If no range, action fetches default (e.g., this year or overall)
      
      const result = await getAnalyticsPageData(rangeToFetch);
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        setError(result.error || 'Could not load analytics data.');
        setAnalyticsData(null);
      }
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred while fetching analytics.');
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // This effect sets the initial date range client-side and triggers the first fetch.
    // This ensures new Date() is called on the client.
    const today = new Date();
    const fromDate = subDays(today, 29);
    const initialRange = { from: fromDate, to: today };
    
    setDateRange(initialRange);
    fetchData(initialRange); // Fetch data with this client-determined initial range
  }, []); // Empty dependency array ensures this runs once on mount

  const handleFilterApply = () => {
    if (dateRange?.from && dateRange?.to) {
        fetchData(dateRange);
    } else {
        // Fallback or error if dateRange is not properly set by the picker
        // For now, if somehow null, let fetchData use its default logic
        fetchData(undefined);
        toast({
            title: "Date range not set",
            description: "Please select a valid date range or showing default.",
            variant: "default"
        });
    }
  };
  
  const formattedChartData = analyticsData?.dailySalesChartData.map(item => ({
    ...item,
    date: analyticsData?.filterRange ? format(parseISO(item.date), 'MMM d') : format(parseISO(item.date), 'MMM d, yy'), 
  })) || [];

  const selectedPeriodText = () => {
    // Use analyticsData.filterRange if available (meaning data is for a specific filtered range)
    if (analyticsData?.filterRange?.from && analyticsData?.filterRange?.to) {
      return `${format(parseISO(analyticsData.filterRange.from), "MMM d, yyyy")} - ${format(parseISO(analyticsData.filterRange.to), "MMM d, yyyy")}`;
    }
    // Fallback to UI selected dateRange if analyticsData.filterRange is not yet populated (e.g. initial load before data response)
    if (dateRange?.from && dateRange?.to) {
       return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
    }
    // Default text if no range is determined yet
    return "Loading range...";
  };


  if (isLoading && !analyticsData) { 
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-3 h-6 w-6 text-primary" /> Business Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Analytics</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!analyticsData) {
    return ( 
         <div className="space-y-6">
            <Card><CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
            <CardContent><p>No analytics data available. Please try applying a filter.</p></CardContent></Card>
        </div>
    );
  }

  const {
    selectedSales,
    selectedOrders,
    averageOrderValue,
    mostPopularItems,
    averageExperienceRating,
    recentExperienceComments,
    recentProductComments,
  } = analyticsData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-3 h-6 w-6 text-primary" /> Business Analytics Overview
              </CardTitle>
              <CardDescription>
                Key metrics for the period: <span className="font-semibold text-primary">{selectedPeriodText()}</span>.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                    disabled={!dateRange} // Disable if dateRange is not yet initialized
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleFilterApply} disabled={isLoading || !dateRange}>
                <Filter className="mr-2 h-4 w-4" /> {isLoading ? "Loading..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales for Period</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(selectedSales)}</div>
            <p className="text-xs text-muted-foreground">
              from {formatNumber(selectedOrders)} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">For selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
                {averageExperienceRating !== null ? averageExperienceRating.toFixed(1) : 'N/A'}
                {averageExperienceRating !== null && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 ml-1" />}
            </div>
            <p className="text-xs text-muted-foreground">For selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Popular Items */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Revenue from completed orders per day for the displayed period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-2">
             {formattedChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value as number)}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={80}
                        fontSize={12}
                      />
                      <RechartsTooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                            formatter={(value) => formatCurrency(value as number)}
                            indicator="dot" 
                        />}
                      />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No sales data available for the selected period.</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-primary" /> Most Popular Items
            </CardTitle>
            <CardDescription>Top 5 items by quantity sold for the displayed period.</CardDescription>
          </CardHeader>
          <CardContent>
            {mostPopularItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Sold</TableHead>
                    <TableHead className="text-right">Avg. Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mostPopularItems.map((item) => (
                    <TableRow key={`${item.productId}-${item.servingType}`}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          ({item.servingType})
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(item.totalQuantitySold)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.averageRating !== null && item.averageRating !== undefined ? (
                          <div className="flex items-center justify-end">
                            {item.averageRating.toFixed(1)} <Star className="ml-1 h-3 w-3 text-yellow-400 fill-yellow-400"/>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No sales data available to determine popular items for this period.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Comments Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Recent Overall Feedback</CardTitle>
            <CardDescription>Latest comments on overall experience for the displayed period.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExperienceComments.length > 0 ? (
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-3">
                  {recentExperienceComments.map((comment, index) => (
                    <CommentCard key={`exp-${index}`} comment={comment} type="overall" />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent overall comments for this period.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/>Recent Product Feedback</CardTitle>
            <CardDescription>Latest comments on specific products for the displayed period.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProductComments.length > 0 ? (
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-3">
                  {recentProductComments.map((comment, index) => (
                    <CommentCard key={`prod-${index}`} comment={comment} type="product" />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent product comments for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    