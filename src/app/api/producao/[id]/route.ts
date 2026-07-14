import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productionRun = await prisma.productionRun.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!productionRun) {
      return NextResponse.json(
        { error: "Produção não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(productionRun);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produção" },
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
    const { productId, quantity, materialUsed, printTime, status, notes, date } = body;

    const existingRun = await prisma.productionRun.findUnique({ where: { id } });
    if (!existingRun) {
      return NextResponse.json(
        { error: "Produção não encontrada" },
        { status: 404 }
      );
    }

    const productionRun = await prisma.productionRun.update({
      where: { id },
      data: {
        productId,
        quantity,
        materialUsed,
        printTime,
        status,
        notes,
        date: date ? new Date(date) : undefined,
      },
      include: { product: true },
    });

    return NextResponse.json(productionRun);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar produção" },
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
    const existingRun = await prisma.productionRun.findUnique({ where: { id } });

    if (!existingRun) {
      return NextResponse.json(
        { error: "Produção não encontrada" },
        { status: 404 }
      );
    }

    if (existingRun.status === "concluido") {
      await prisma.product.update({
        where: { id: existingRun.productId },
        data: { stock: { decrement: existingRun.quantity } },
      });
    }

    await prisma.productionRun.delete({ where: { id } });

    return NextResponse.json({ message: "Produção excluída com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir produção" },
      { status: 500 }
    );
  }
}
