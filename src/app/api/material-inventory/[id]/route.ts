import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await prisma.materialInventory.findUnique({ where: { id } });

    if (!material) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar material" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, brand, color, totalWeight, remainingWeight, purchasePrice, purchaseDate, notes } = body;

    const existingMaterial = await prisma.materialInventory.findUnique({ where: { id } });
    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    const finalTotalWeight = totalWeight ?? existingMaterial.totalWeight;
    const finalPurchasePrice = purchasePrice ?? existingMaterial.purchasePrice;
    const costPerGram = finalTotalWeight > 0 ? finalPurchasePrice / finalTotalWeight : 0;

    const material = await prisma.materialInventory.update({
      where: { id },
      data: {
        name,
        type,
        brand,
        color,
        totalWeight,
        remainingWeight,
        purchasePrice,
        costPerGram,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        notes,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar material" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingMaterial = await prisma.materialInventory.findUnique({ where: { id } });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    await prisma.materialInventory.delete({ where: { id } });

    return NextResponse.json({ message: "Material excluído com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir material" },
      { status: 500 }
    );
  }
}
