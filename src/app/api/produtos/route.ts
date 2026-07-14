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
            { name: { contains: search } },
            { sku: { contains: search } },
            { description: { contains: search } },
            { materialType: { contains: search } },
            { materialBrand: { contains: search } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          photo: true,
          photos: true,
          materialType: true,
          materialBrand: true,
          materialColor: true,
          materialWeightUsed: true,
          materialCost: true,
          laborCost: true,
          energyCost: true,
          otherCost: true,
          totalCost: true,
          salePrice: true,
          stock: true,
          weightPerPiece: true,
          printTimeMinutes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              productionRuns: true,
              sales: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, sku, description, photo, photos,
      materialType, materialBrand, materialColor, materialWeightUsed,
      materialCost, laborCost, energyCost, otherCost,
      salePrice, stock, weightPerPiece, printTimeMinutes,
    } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Nome e SKU são obrigatórios" },
        { status: 400 }
      );
    }

    const totalCost =
      (materialCost || 0) +
      (laborCost || 0) +
      (energyCost || 0) +
      (otherCost || 0);

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        photo,
        photos,
        materialType,
        materialBrand,
        materialColor,
        materialWeightUsed: materialWeightUsed || 0,
        materialCost: materialCost || 0,
        laborCost: laborCost || 0,
        energyCost: energyCost || 0,
        otherCost: otherCost || 0,
        totalCost,
        salePrice: salePrice || 0,
        stock: stock || 0,
        weightPerPiece: weightPerPiece || 0,
        printTimeMinutes: printTimeMinutes || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
