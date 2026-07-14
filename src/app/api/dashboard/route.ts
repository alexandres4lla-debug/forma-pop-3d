import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    const dateFilter = startDateParam || endDateParam
      ? {
          gte: startDateParam ? new Date(startDateParam) : undefined,
          lte: endDateParam ? new Date(endDateParam) : undefined,
        }
      : undefined;

    const [
      totalProducts,
      totalRevenue,
      totalPurchases,
      totalProductionMaterialCosts,
      productsLowStock,
      thisMonthSales,
      thisMonthPurchases,
      thisMonthProduction,
      recentSales,
      recentPurchases,
      recentProduction,
      topProductsData,
      totalMaterialWeightAgg,
      totalPrintTimeAgg,
      filamentConsumedAgg,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.sale.aggregate({ _sum: { totalPrice: true } }),
      prisma.purchase.aggregate({ _sum: { totalPrice: true } }),
      prisma.productionRun.aggregate({ _sum: { materialUsed: true } }),
      prisma.product.findMany({
        where: { stock: { lt: 5 } },
        select: { id: true, name: true, stock: true },
      }),
      prisma.sale.aggregate({
        where: {
          date: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: {
          date: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.productionRun.count({
        where: {
          date: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { product: true },
      }),
      prisma.purchase.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.productionRun.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { product: true },
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: { totalPrice: true },
        _count: true,
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5,
      }),
      prisma.product.aggregate({
        _sum: { materialWeightUsed: true, stock: true },
      }),
      prisma.productionRun.aggregate({
        ...(dateFilter ? { where: { date: dateFilter } } : {}),
        _sum: { printTime: true },
      }),
      prisma.productionRun.aggregate({
        ...(dateFilter ? { where: { date: dateFilter } } : {}),
        _sum: { materialUsed: true },
      }),
    ]);

    const totalRevenueValue = totalRevenue._sum.totalPrice || 0;
    const totalPurchasesValue = totalPurchases._sum.totalPrice || 0;
    const totalProductionCosts = (totalProductionMaterialCosts._sum.materialUsed || 0) * 10;
    const totalCosts = totalPurchasesValue + totalProductionCosts;
    const profit = totalRevenueValue - totalCosts;

    const materialWeightSum = totalMaterialWeightAgg._sum.materialWeightUsed || 0;
    const stockSum = totalMaterialWeightAgg._sum.stock || 0;
    const totalMaterialWeight = materialWeightSum * stockSum;

    const totalPrintTime = totalPrintTimeAgg._sum.printTime || 0;
    const filamentConsumed = filamentConsumedAgg._sum.materialUsed || 0;

    const monthlySales = [];
    const monthlyPurchases = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM/yyyy", { locale: ptBR });

      const [salesData, purchasesData] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalPrice: true },
          _count: true,
        }),
        prisma.purchase.aggregate({
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalPrice: true },
          _count: true,
        }),
      ]);

      monthlySales.push({
        month: monthLabel,
        total: salesData._sum.totalPrice || 0,
        count: salesData._count,
      });

      monthlyPurchases.push({
        month: monthLabel,
        total: purchasesData._sum.totalPrice || 0,
        count: purchasesData._count,
      });
    }

    const recentActivity = [
      ...recentSales.map((sale) => ({
        type: "sale" as const,
        id: sale.id,
        description: `Venda para ${sale.customerName}`,
        amount: sale.totalPrice,
        date: sale.date,
        details: sale.product?.name || "Sem produto",
      })),
      ...recentPurchases.map((purchase) => ({
        type: "purchase" as const,
        id: purchase.id,
        description: `Compra: ${purchase.description}`,
        amount: purchase.totalPrice,
        date: purchase.date,
        details: purchase.material,
      })),
      ...recentProduction.map((run) => ({
        type: "production" as const,
        id: run.id,
        description: `Produção: ${run.product?.name || "N/A"}`,
        amount: run.materialUsed * 10,
        date: run.date,
        details: `${run.quantity} unidades - ${run.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId || "" },
        });
        return {
          productId: item.productId,
          name: product?.name || "Desconhecido",
          photo: product?.photo || null,
          materialType: product?.materialType || null,
          revenue: item._sum.totalPrice || 0,
          salesCount: item._count,
        };
      })
    );

    return NextResponse.json({
      totalProducts,
      totalRevenue: totalRevenueValue,
      totalCosts,
      profit,
      productsLowStock,
      thisMonthSales: {
        total: thisMonthSales._sum.totalPrice || 0,
        count: thisMonthSales._count,
      },
      thisMonthPurchases: {
        total: thisMonthPurchases._sum.totalPrice || 0,
        count: thisMonthPurchases._count,
      },
      thisMonthProduction,
      totalMaterialWeight,
      totalPrintTime,
      filamentConsumed,
      monthlySales,
      monthlyPurchases,
      recentActivity,
      topProducts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
