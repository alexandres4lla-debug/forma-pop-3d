import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "production";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = {
      gte: startDate ? new Date(startDate) : subMonths(new Date(), 12),
      lte: endDate ? new Date(endDate) : new Date(),
    };

    switch (type) {
      case "production": {
        const [productionRuns, statusCounts, totalMaterialUsed, totalPrintTime] = await Promise.all([
          prisma.productionRun.findMany({
            where: { date: dateFilter },
            include: { product: true },
            orderBy: { date: "desc" },
          }),
          prisma.productionRun.groupBy({
            by: ["status"],
            where: { date: dateFilter },
            _count: true,
          }),
          prisma.productionRun.aggregate({
            where: { date: dateFilter },
            _sum: { materialUsed: true },
          }),
          prisma.productionRun.aggregate({
            where: { date: dateFilter },
            _sum: { printTime: true },
          }),
        ]);

        const monthlyProduction = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const monthLabel = format(monthDate, "MMM/yyyy", { locale: ptBR });

          const count = await prisma.productionRun.count({
            where: {
              date: { gte: monthStart, lte: monthEnd },
            },
          });

          monthlyProduction.push({
            month: monthLabel,
            count,
          });
        }

        return NextResponse.json({
          type: "production",
          summary: {
            totalRuns: productionRuns.length,
            totalMaterialUsed: totalMaterialUsed._sum.materialUsed || 0,
            totalPrintTime: totalPrintTime._sum.printTime || 0,
            statusBreakdown: statusCounts.map((item) => ({
              status: item.status,
              count: item._count,
            })),
          },
          monthlyProduction,
          runs: productionRuns,
        });
      }

      case "financial": {
        const [sales, purchases, totalRevenue, totalCosts] = await Promise.all([
          prisma.sale.findMany({
            where: { date: dateFilter },
            include: { product: true },
            orderBy: { date: "desc" },
          }),
          prisma.purchase.findMany({
            where: { date: dateFilter },
            orderBy: { date: "desc" },
          }),
          prisma.sale.aggregate({
            where: { date: dateFilter },
            _sum: { totalPrice: true },
          }),
          prisma.purchase.aggregate({
            where: { date: dateFilter },
            _sum: { totalPrice: true },
          }),
        ]);

        const monthlyFinancial = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const monthLabel = format(monthDate, "MMM/yyyy", { locale: ptBR });

          const [monthSales, monthPurchases] = await Promise.all([
            prisma.sale.aggregate({
              where: { date: { gte: monthStart, lte: monthEnd } },
              _sum: { totalPrice: true },
            }),
            prisma.purchase.aggregate({
              where: { date: { gte: monthStart, lte: monthEnd } },
              _sum: { totalPrice: true },
            }),
          ]);

          monthlyFinancial.push({
            month: monthLabel,
            revenue: monthSales._sum.totalPrice || 0,
            costs: monthPurchases._sum.totalPrice || 0,
          });
        }

        const totalRevenueValue = totalRevenue._sum.totalPrice || 0;
        const totalCostsValue = totalCosts._sum.totalPrice || 0;

        return NextResponse.json({
          type: "financial",
          summary: {
            totalRevenue: totalRevenueValue,
            totalCosts: totalCostsValue,
            profit: totalRevenueValue - totalCostsValue,
            salesCount: sales.length,
            purchasesCount: purchases.length,
          },
          monthlyFinancial,
          sales,
          purchases,
        });
      }

      case "inventory": {
        const [products, lowStockProducts, totalStockValue] = await Promise.all([
          prisma.product.findMany({
            orderBy: { stock: "desc" },
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              totalCost: true,
              salePrice: true,
              materialType: true,
              materialBrand: true,
              materialColor: true,
              materialWeightUsed: true,
            },
          }),
          prisma.product.findMany({
            where: { stock: { lt: 5 } },
            orderBy: { stock: "asc" },
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              totalCost: true,
              materialType: true,
              materialBrand: true,
              materialColor: true,
              materialWeightUsed: true,
            },
          }),
          prisma.product.aggregate({
            _sum: { stock: true, totalCost: true },
          }),
        ]);

        const stockByProduct = products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          totalValue: product.stock * product.totalCost,
          costPerUnit: product.totalCost,
          salePrice: product.salePrice,
          materialType: product.materialType,
          materialBrand: product.materialBrand,
          materialColor: product.materialColor,
          materialWeightUsed: product.materialWeightUsed,
          margin: product.salePrice > 0
            ? ((product.salePrice - product.totalCost) / product.salePrice * 100).toFixed(2)
            : "0",
        }));

        return NextResponse.json({
          type: "inventory",
          summary: {
            totalProducts: products.length,
            totalStock: totalStockValue._sum.stock || 0,
            totalStockValue: (totalStockValue._sum.totalCost || 0) * (totalStockValue._sum.stock || 0),
            lowStockCount: lowStockProducts.length,
          },
          lowStockProducts,
          stockByProduct,
        });
      }

      default:
        return NextResponse.json(
          { error: "Tipo de relatório inválido. Use: production, financial ou inventory" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
