
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
import { BarChart3, TrendingUp, ShoppingCart, Users, DollarSign, AlertCircle, Package } from 'lucide-react';
import { getAnalyticsPageData, type DailySalesData } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";

// Helper function to format currency
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


export default async function AdminAnalyticsPage() {
  const result = await getAnalyticsPageData();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-3 h-6 w-6 text-primary" /> Business Analytics
            </CardTitle>
            <CardDescription>
              Track sales, popular items, and gain insights into your cafe's performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Analytics</AlertTitle>
              <AlertDescription>
                {result.error || 'Could not load analytics data at this time. Please try again later.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    todaySales,
    todayOrders,
    weekSales,
    weekOrders,
    monthSales,
    monthOrders,
    averageOrderValue,
    mostPopularItems,
    dailySalesChartData,
  } = result.data;

  // Format data for the chart - ensure date is short
  const formattedChartData = dailySalesChartData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-3 h-6 w-6 text-primary" /> Business Analytics Overview
          </CardTitle>
          <CardDescription>
            Key metrics and performance insights for Caffico Express.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todaySales)}</div>
            <p className="text-xs text-muted-foreground">
              from {formatNumber(todayOrders)} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekSales)}</div>
             <p className="text-xs text-muted-foreground">
              from {formatNumber(weekOrders)} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthSales)}</div>
             <p className="text-xs text-muted-foreground">
              from {formatNumber(monthOrders)} orders
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
            <p className="text-xs text-muted-foreground">Overall AOV</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Popular Items */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Daily Sales Trend (Last 30 Days)</CardTitle>
            <CardDescription>Revenue from completed orders per day.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-2">
             {dailySalesChartData.length > 0 ? (
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
                      <ChartTooltip
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
                  <p className="text-muted-foreground">No sales data available for the last 30 days.</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-primary" /> Most Popular Items
            </CardTitle>
            <CardDescription>Top 5 items by quantity sold.</CardDescription>
          </CardHeader>
          <CardContent>
            {mostPopularItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mostPopularItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          ({item.servingType})
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.totalQuantitySold)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No sales data available to determine popular items.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
