
'use server';

import prisma from '@/lib/prisma';
import { OrderStatus, type ExperienceRating, type ProductRating } from '@prisma/client';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
  eachDayOfInterval,
  isValid,
  parseISO,
} from 'date-fns';
import type { ExperienceComment, ProductComment } from '@/types';


interface SalesData {
  totalSales: number;
  orderCount: number;
}

export async function getSalesAndOrderCount(
  startDate: Date,
  endDate: Date
): Promise<SalesData> {
  if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Invalid dates provided to getSalesAndOrderCount:', startDate, endDate);
    return { totalSales: 0, orderCount: 0 };
  }
  try {
    const result = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return {
      totalSales: result._sum.totalAmount || 0,
      orderCount: result._count.id || 0,
    };
  } catch (error) {
    console.error('Error fetching sales and order count:', error);
    return { totalSales: 0, orderCount: 0 };
  }
}

export async function getOverallAverageOrderValue(startDate?: Date, endDate?: Date): Promise<number> {
  try {
    const whereClause: any = { status: OrderStatus.COMPLETED };
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const completedOrdersAggregation = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      where: whereClause,
    });

    if (
      completedOrdersAggregation._count.id &&
      completedOrdersAggregation._count.id > 0
    ) {
      return (
        (completedOrdersAggregation._sum.totalAmount || 0) /
        completedOrdersAggregation._count.id
      );
    }
    return 0;
  } catch (error) {
    console.error('Error fetching AOV:', error);
    return 0;
  }
}

export interface PopularItem {
  productId: string;
  productName: string;
  servingType: string;
  totalQuantitySold: number;
  averageRating?: number | null;
}

export async function getMostPopularItems(
  limit: number = 5,
  startDate?: Date,
  endDate?: Date
): Promise<PopularItem[]> {
  try {
    const orderWhereClause: any = { status: OrderStatus.COMPLETED };
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      orderWhereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const items = await prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'servingType'],
      _sum: {
        quantity: true,
      },
      where: {
        order: orderWhereClause,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const productIds = items.map(item => item.productId);
    const productRatingWhereClause: any = { productId: { in: productIds } };
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      // Assuming ProductRating links to Order, and Order has createdAt
       productRatingWhereClause.order = {
         createdAt: {
           gte: startDate,
           lte: endDate,
         }
       };
    }


    const avgRatings = await prisma.productRating.groupBy({
      by: ['productId'],
      _avg: {
        rating: true,
      },
      where: productRatingWhereClause,
    });

    const ratingsMap = new Map(avgRatings.map(r => [r.productId, r._avg.rating]));

    return items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      servingType: item.servingType,
      totalQuantitySold: item._sum.quantity || 0,
      averageRating: ratingsMap.get(item.productId) ?? null,
    }));
  } catch (error) {
    console.error('Error fetching most popular items:', error);
    return [];
  }
}

export interface DailySalesData {
  date: string; // YYYY-MM-DD
  sales: number;
}

export async function getSalesChartDataForRange(
  startDate: Date,
  endDate: Date
): Promise<DailySalesData[]> {
  if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
    console.error('Invalid date range for sales chart data:', startDate, endDate);
    return [];
  }
  try {
    const dateArray = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    
    const salesByDayMap = new Map<string, number>();
    dateArray.forEach(day => {
        salesByDayMap.set(format(day, 'yyyy-MM-dd'), 0);
    });

    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    orders.forEach((order) => {
      const orderDateStr = format(order.createdAt, 'yyyy-MM-dd');
      salesByDayMap.set(orderDateStr, (salesByDayMap.get(orderDateStr) || 0) + order.totalAmount);
    });
    
    const dailySales: DailySalesData[] = [];
    salesByDayMap.forEach((sales, date) => {
        dailySales.push({ date, sales});
    });

    dailySales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dailySales;
  } catch (error) {
    console.error(`Error fetching daily sales for range:`, error);
    return [];
  }
}

export async function getOverallAverageExperienceRating(startDate?: Date, endDate?: Date): Promise<number | null> {
  try {
    const whereClause: any = {};
     if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      // Assuming ExperienceRating links to Order, and Order has createdAt
       whereClause.order = {
         createdAt: {
           gte: startDate,
           lte: endDate,
         }
       };
    }
    const result = await prisma.experienceRating.aggregate({
      _avg: {
        rating: true,
      },
      where: whereClause,
    });
    return result._avg.rating ?? null;
  } catch (error) {
    console.error('Error fetching average experience rating:', error);
    return null;
  }
}

export async function getRecentExperienceComments(limit: number = 3, startDate?: Date, endDate?: Date): Promise<ExperienceComment[]> {
  try {
    const whereClause: any = {
      comment: {
        not: null,
        notIn: [''],
      },
    };
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
       whereClause.order = {
         createdAt: {
           gte: startDate,
           lte: endDate,
         }
       };
    }

    const comments = await prisma.experienceRating.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        comment: true,
        rating: true,
        createdAt: true,
        order: {
          select: {
            customerName: true,
          },
        },
      },
    });
    return comments.map(c => ({
      comment: c.comment,
      rating: c.rating,
      createdAt: c.createdAt,
      customerName: c.order.customerName,
    }));
  } catch (error) {
    console.error('Error fetching recent experience comments:', error);
    return [];
  }
}

export async function getRecentProductComments(limit: number = 3, startDate?: Date, endDate?: Date): Promise<ProductComment[]> {
   try {
    const whereClause: any = {
      comment: {
        not: null,
        notIn: [''],
      },
    };
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
       whereClause.order = {
         createdAt: {
           gte: startDate,
           lte: endDate,
         }
       };
    }

    const comments = await prisma.productRating.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        productName: true,
        comment: true,
        rating: true,
        createdAt: true,
         order: {
          select: {
            customerName: true,
          },
        },
      },
    });
     return comments.map(c => ({
      productName: c.productName,
      comment: c.comment,
      rating: c.rating,
      createdAt: c.createdAt,
      customerName: c.order.customerName,
    }));
  } catch (error) {
    console.error('Error fetching recent product comments:', error);
    return [];
  }
}

export interface AnalyticsPageData {
  selectedSales: number;
  selectedOrders: number;
  averageOrderValue: number;
  mostPopularItems: PopularItem[];
  dailySalesChartData: DailySalesData[];
  averageExperienceRating: number | null;
  recentExperienceComments: ExperienceComment[];
  recentProductComments: ProductComment[];
  filterRange?: { from: string, to: string };
}

export async function getAnalyticsPageData(dateRange?: { from?: string; to?: string }): Promise<{
  success: boolean;
  data?: AnalyticsPageData;
  error?: string;
}> {
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let filterRangeApplied = false;

  if (dateRange?.from && dateRange?.to) {
    startDate = parseISO(dateRange.from);
    endDate = parseISO(dateRange.to);
    if (isValid(startDate) && isValid(endDate)) {
        startDate = startOfDay(startDate);
        endDate = endOfDay(endDate);
        filterRangeApplied = true;
    } else {
      console.warn("Invalid date range provided, falling back to defaults or overall.")
      startDate = undefined;
      endDate = undefined;
    }
  }

  // Default chart range if no valid dateRange is provided for it
  const chartStartDate = filterRangeApplied && startDate ? startDate : subDays(startOfDay(new Date()), 29);
  const chartEndDate = filterRangeApplied && endDate ? endDate : endOfDay(new Date());
  
  // For summary cards, if no range, use a wide range (e.g., year) or specific logic.
  // For now, if a range is applied, salesData will use it. Otherwise, it will fetch for "This Year" as an example default.
  const summaryStartDate = filterRangeApplied && startDate ? startDate : startOfYear(new Date());
  const summaryEndDate = filterRangeApplied && endDate ? endDate : endOfYear(new Date());


  try {
    const [
      salesData,
      overallAOV, // AOV can be for the selected range or overall. Let's make it for selected range if provided.
      popularItems,
      dailySalesDataForChart,
      avgExperienceRating, // Can also be for selected range
      recentExpComments, // Can also be for selected range
      recentProdComments, // Can also be for selected range
    ] = await Promise.all([
      getSalesAndOrderCount(summaryStartDate, summaryEndDate),
      getOverallAverageOrderValue(startDate, endDate), // Pass range if available
      getMostPopularItems(5, startDate, endDate), // Pass range
      getSalesChartDataForRange(chartStartDate, chartEndDate),
      getOverallAverageExperienceRating(startDate, endDate), // Pass range
      getRecentExperienceComments(3, startDate, endDate), // Pass range
      getRecentProductComments(3, startDate, endDate), // Pass range
    ]);

    return {
      success: true,
      data: {
        selectedSales: salesData.totalSales,
        selectedOrders: salesData.orderCount,
        averageOrderValue: overallAOV,
        mostPopularItems: popularItems,
        dailySalesChartData: dailySalesDataForChart,
        averageExperienceRating: avgExperienceRating,
        recentExperienceComments: recentExpComments,
        recentProductComments: recentProdComments,
        filterRange: filterRangeApplied && startDate && endDate ? { from: format(startDate, 'yyyy-MM-dd'), to: format(endDate, 'yyyy-MM-dd') } : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to fetch analytics page data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data.';
    return { success: false, error: errorMessage };
  }
}


    