import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productionRuns: true,
        sales: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
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
    const {
      name, sku, description, photo, photos,
      materialType, materialBrand, materialColor, materialWeightUsed,
      materialCost, laborCost, energyCost, otherCost,
      salePrice, stock, weightPerPiece, printTimeMinutes,
    } = body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const totalCost =
      (materialCost ?? existingProduct.materialCost) +
      (laborCost ?? existingProduct.laborCost) +
      (energyCost ?? existingProduct.energyCost) +
      (otherCost ?? existingProduct.otherCost);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        photo,
        photos,
        materialType,
        materialBrand,
        materialColor,
        materialWeightUsed,
        materialCost,
        laborCost,
        energyCost,
        otherCost,
        totalCost,
        salePrice,
        stock,
        weightPerPiece,
        printTimeMinutes,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
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
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}
