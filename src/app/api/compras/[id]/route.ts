import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({ where: { id } });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar compra" },
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
    const { description, material, quantity, unitPrice, weightGrams, date, notes } = body;

    const existingPurchase = await prisma.purchase.findUnique({ where: { id } });
    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra não encontrada" },
        { status: 404 }
      );
    }

    const totalPrice = (quantity || existingPurchase.quantity) *
      (unitPrice || existingPurchase.unitPrice);

    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        description,
        material,
        quantity,
        unitPrice,
        totalPrice,
        weightGrams: weightGrams || 0,
        date: date ? new Date(date) : undefined,
        notes,
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar compra" },
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
    const existingPurchase = await prisma.purchase.findUnique({ where: { id } });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: "Compra não encontrada" },
        { status: 404 }
      );
    }

    await prisma.purchase.delete({ where: { id } });

    return NextResponse.json({ message: "Compra excluída com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir compra" },
      { status: 500 }
    );
  }
}
