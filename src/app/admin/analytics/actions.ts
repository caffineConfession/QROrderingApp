
'use server';

import prisma from '@/lib/prisma';
import { OrderStatus, type ExperienceRating, type ProductRating } from '@prisma/client';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
  eachDayOfInterval,
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

export async function getOverallAverageOrderValue(): Promise<number> {
  try {
    const completedOrdersAggregation = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: OrderStatus.COMPLETED,
      },
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
    console.error('Error fetching overall AOV:', error);
    return 0;
  }
}

export interface PopularItem {
  productId: string; // Added productId
  productName: string;
  servingType: string;
  totalQuantitySold: number;
  averageRating?: number | null; // Added averageRating
}

export async function getMostPopularItems(
  limit: number = 5
): Promise<PopularItem[]> {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'servingType'], // Group by productId as well
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          status: OrderStatus.COMPLETED,
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get average ratings for these popular items
    const productIds = items.map(item => item.productId);
    const avgRatings = await prisma.productRating.groupBy({
      by: ['productId'],
      _avg: {
        rating: true,
      },
      where: {
        productId: { in: productIds },
      },
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

export async function getDailySalesForLastNDays(
  days: number = 30
): Promise<DailySalesData[]> {
  try {
    const endDate = endOfToday();
    const startDate = startOfToday(); 
    const dateArray = eachDayOfInterval({
      start: subDays(startDate, days -1), 
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
          gte: subDays(startDate, days -1),
          lte: endDate,
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
    console.error(`Error fetching daily sales for last ${days} days:`, error);
    return [];
  }
}

export async function getOverallAverageExperienceRating(): Promise<number | null> {
  try {
    const result = await prisma.experienceRating.aggregate({
      _avg: {
        rating: true,
      },
    });
    return result._avg.rating ?? null;
  } catch (error) {
    console.error('Error fetching average experience rating:', error);
    return null;
  }
}

export async function getRecentExperienceComments(limit: number = 5): Promise<ExperienceComment[]> {
  try {
    const comments = await prisma.experienceRating.findMany({
      where: {
        comment: {
          not: null,
          notIn: [''], // Exclude empty strings if desired
        },
      },
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

export async function getRecentProductComments(limit: number = 5): Promise<ProductComment[]> {
   try {
    const comments = await prisma.productRating.findMany({
      where: {
        comment: {
          not: null,
          notIn: [''],
        },
      },
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


export async function getAnalyticsPageData() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); 
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const currentYearStart = startOfYear(new Date());
  const currentYearEnd = endOfYear(new Date());

  try {
    const [
      todayData,
      weekData,
      monthData,
      yearData,
      overallAOV,
      popularItems,
      last30DaysSales,
      avgExperienceRating,
      recentExpComments,
      recentProdComments,
    ] = await Promise.all([
      getSalesAndOrderCount(todayStart, todayEnd),
      getSalesAndOrderCount(weekStart, weekEnd),
      getSalesAndOrderCount(monthStart, monthEnd),
      getSalesAndOrderCount(currentYearStart, currentYearEnd),
      getOverallAverageOrderValue(),
      getMostPopularItems(5),
      getDailySalesForLastNDays(30),
      getOverallAverageExperienceRating(),
      getRecentExperienceComments(3),
      getRecentProductComments(3),
    ]);

    return {
      success: true,
      data: {
        todaySales: todayData.totalSales,
        todayOrders: todayData.orderCount,
        weekSales: weekData.totalSales,
        weekOrders: weekData.orderCount,
        monthSales: monthData.totalSales,
        monthOrders: monthData.orderCount,
        yearSales: yearData.totalSales,
        yearOrders: yearData.orderCount,
        averageOrderValue: overallAOV,
        mostPopularItems: popularItems,
        dailySalesChartData: last30DaysSales,
        averageExperienceRating: avgExperienceRating,
        recentExperienceComments: recentExpComments,
        recentProductComments: recentProdComments,
      },
    };
  } catch (error) {
    console.error('Failed to fetch analytics page data:', error);
    return { success: false, error: 'Failed to load analytics data.' };
  }
}
