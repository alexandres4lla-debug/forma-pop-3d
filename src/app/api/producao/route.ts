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
    const status = searchParams.get("status") || "";

    const where = {
      ...(search
        ? {
            OR: [
              { product: { name: { contains: search } } },
              { notes: { contains: search } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [productionRuns, total] = await Promise.all([
      prisma.productionRun.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.productionRun.count({ where }),
    ]);

    return NextResponse.json({
      productionRuns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produções" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, materialUsed, printTime, status, notes, date } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Produto e quantidade são obrigatórios" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const productionRun = await prisma.productionRun.create({
      data: {
        productId,
        quantity,
        materialUsed: materialUsed || 0,
        printTime: printTime || 0,
        status: status || "em_andamento",
        notes,
        date: date ? new Date(date) : new Date(),
      },
      include: { product: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

    return NextResponse.json(productionRun, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar produção" },
      { status: 500 }
    );
  }
}
