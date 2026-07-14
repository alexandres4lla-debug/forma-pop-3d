import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { customerName: { contains: search } },
            { marketplace: { contains: search } },
            { notes: { contains: search } },
            { product: { name: { contains: search } } },
          ],
        }
      : {};

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerName, marketplace, quantity, unitPrice, paymentMethod, date, notes } = body;

    if (!customerName || !marketplace || !quantity) {
      return NextResponse.json(
        { error: "Cliente, marketplace e quantidade são obrigatórios" },
        { status: 400 }
      );
    }

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente. Disponível: ${product.stock}` },
          { status: 400 }
        );
      }
    }

    const totalPrice = quantity * (unitPrice || 0);

    const sale = await prisma.sale.create({
      data: {
        productId: productId || null,
        customerName,
        marketplace,
        quantity,
        unitPrice: unitPrice || 0,
        totalPrice,
        paymentMethod: paymentMethod || "dinheiro",
        date: date ? new Date(date) : new Date(),
        notes,
      },
      include: { product: true },
    });

    if (productId) {
      await prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar venda" },
      { status: 500 }
    );
  }
}
