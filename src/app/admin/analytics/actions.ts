
'use server';

import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
  eachDayOfInterval,
} from 'date-fns';

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
  productName: string;
  servingType: string;
  totalQuantitySold: number;
}

export async function getMostPopularItems(
  limit: number = 5
): Promise<PopularItem[]> {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productName', 'servingType'],
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

    return items.map((item) => ({
      productName: item.productName,
      servingType: item.servingType,
      totalQuantitySold: item._sum.quantity || 0,
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
    const startDate = startOfToday(); // use startOfToday to ensure consistent range for subDays
    const dateArray = eachDayOfInterval({
      start: subDays(startDate, days -1), // -1 because we want to include today
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

    // Ensure the array is sorted by date if the map iteration order is not guaranteed
    dailySales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dailySales;
  } catch (error) {
    console.error(`Error fetching daily sales for last ${days} days:`, error);
    return [];
  }
}


export async function getAnalyticsPageData() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Assuming week starts on Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  try {
    const [
      todayData,
      weekData,
      monthData,
      overallAOV,
      popularItems,
      last30DaysSales,
    ] = await Promise.all([
      getSalesAndOrderCount(todayStart, todayEnd),
      getSalesAndOrderCount(weekStart, weekEnd),
      getSalesAndOrderCount(monthStart, monthEnd),
      getOverallAverageOrderValue(),
      getMostPopularItems(5),
      getDailySalesForLastNDays(30),
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
        averageOrderValue: overallAOV,
        mostPopularItems: popularItems,
        dailySalesChartData: last30DaysSales,
      },
    };
  } catch (error) {
    console.error('Failed to fetch analytics page data:', error);
    return { success: false, error: 'Failed to load analytics data.' };
  }
}
