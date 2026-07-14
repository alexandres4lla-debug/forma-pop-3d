import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { type: { contains: search } },
            { brand: { contains: search } },
            { color: { contains: search } },
          ],
        }
      : {};

    const materials = await prisma.materialInventory.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar inventário de materiais" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, brand, color, totalWeight, remainingWeight, purchasePrice, purchaseDate, notes } = body;

    if (!name || !type || !totalWeight || !purchasePrice) {
      return NextResponse.json(
        { error: "Nome, tipo, peso total e preço de compra são obrigatórios" },
        { status: 400 }
      );
    }

    const costPerGram = totalWeight > 0 ? purchasePrice / totalWeight : 0;

    const material = await prisma.materialInventory.create({
      data: {
        name,
        type,
        brand,
        color,
        totalWeight,
        remainingWeight: remainingWeight ?? totalWeight,
        purchasePrice,
        costPerGram,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar material no inventário" },
      { status: 500 }
    );
  }
}
