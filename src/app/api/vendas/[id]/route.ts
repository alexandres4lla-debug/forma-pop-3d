import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar venda" },
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
    const { productId, customerName, marketplace, quantity, unitPrice, paymentMethod, date, notes } = body;

    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 }
      );
    }

    const totalPrice = (quantity || existingSale.quantity) *
      (unitPrice || existingSale.unitPrice);

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        productId,
        customerName,
        marketplace,
        quantity,
        unitPrice,
        totalPrice,
        paymentMethod,
        date: date ? new Date(date) : undefined,
        notes,
      },
      include: { product: true },
    });

    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar venda" },
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
    const existingSale = await prisma.sale.findUnique({ where: { id } });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 }
      );
    }

    await prisma.sale.delete({ where: { id } });

    return NextResponse.json({ message: "Venda excluída com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir venda" },
      { status: 500 }
    );
  }
}
