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
            { description: { contains: search } },
            { material: { contains: search } },
            { notes: { contains: search } },
          ],
        }
      : {};

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({
      purchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar compras" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, material, quantity, unitPrice, weightGrams, date, notes } = body;

    if (!description || !material) {
      return NextResponse.json(
        { error: "Descrição e material são obrigatórios" },
        { status: 400 }
      );
    }

    const totalPrice = (quantity || 0) * (unitPrice || 0);

    const purchase = await prisma.purchase.create({
      data: {
        description,
        material,
        quantity: quantity || 0,
        unitPrice: unitPrice || 0,
        totalPrice,
        weightGrams: weightGrams || 0,
        date: date ? new Date(date) : new Date(),
        notes,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar compra" },
      { status: 500 }
    );
  }
}
