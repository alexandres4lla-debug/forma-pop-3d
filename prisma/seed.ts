const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.sale.deleteMany();
  await prisma.productionRun.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.materialInventory.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@formapop3d.com",
      password: hashedPassword,
      name: "Admin",
    },
  });

  console.log("Creating products...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Suporte de Celular Ajustável",
        sku: "SUP-001",
        description: "Suporte de celular ajustável para mesa, compatível com qualquer modelo",
        materialType: "PLA",
        materialBrand: "Voolt",
        materialColor: "Preto",
        materialWeightUsed: 45,
        materialCost: 3.56,
        laborCost: 2.0,
        energyCost: 0.8,
        otherCost: 0.5,
        totalCost: 6.86,
        salePrice: 24.9,
        stock: 35,
        weightPerPiece: 45,
        printTimeMinutes: 120,
      },
    }),
    prisma.product.create({
      data: {
        name: "Organizador de Mesa",
        sku: "ORG-002",
        description: "Organizador de mesa com compartimentos para canhas, clipes e post-its",
        materialType: "PLA",
        materialBrand: "Voolt",
        materialColor: "Branco",
        materialWeightUsed: 85,
        materialCost: 5.94,
        laborCost: 3.0,
        energyCost: 1.2,
        otherCost: 0.8,
        totalCost: 10.94,
        salePrice: 39.9,
        stock: 20,
        weightPerPiece: 85,
        printTimeMinutes: 240,
      },
    }),
    prisma.product.create({
      data: {
        name: "Porta Fone de Ouvido",
        sku: "PFO-003",
        description: "Suporte de parede para fone de ouvido com acabamento fosco",
        materialType: "PETG",
        materialBrand: "Voolt",
        materialColor: "Preto",
        materialWeightUsed: 55,
        materialCost: 4.95,
        laborCost: 2.5,
        energyCost: 1.0,
        otherCost: 0.6,
        totalCost: 9.05,
        salePrice: 29.9,
        stock: 40,
        weightPerPiece: 55,
        printTimeMinutes: 150,
      },
    }),
    prisma.product.create({
      data: {
        name: "Boneco Decorativo Gamer",
        sku: "BDC-004",
        description: "Boneco decorativo temático gamer, ideal para prateleiras e estantes",
        materialType: "Resina",
        materialBrand: "Anycubic",
        materialColor: "Cinza",
        materialWeightUsed: 30,
        materialCost: 7.79,
        laborCost: 4.0,
        energyCost: 0.6,
        otherCost: 1.0,
        totalCost: 13.39,
        salePrice: 49.9,
        stock: 15,
        weightPerPiece: 30,
        printTimeMinutes: 180,
      },
    }),
    prisma.product.create({
      data: {
        name: "Capa de Tablet Resistente",
        sku: "CPT-005",
        description: "Capa flexível e resistente para tablets de até 10 polegadas",
        materialType: "TPU",
        materialBrand: "eSun",
        materialColor: "Preto",
        materialWeightUsed: 60,
        materialCost: 14.39,
        laborCost: 3.0,
        energyCost: 1.4,
        otherCost: 0.9,
        totalCost: 19.69,
        salePrice: 59.9,
        stock: 25,
        weightPerPiece: 60,
        printTimeMinutes: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: "Suporte para Plantas de Parede",
        sku: "SPP-006",
        description: "Vaso de parede geométrico para plantas suculentas, resistente à UV",
        materialType: "ASA",
        materialBrand: "Voolt",
        materialColor: "Branco",
        materialWeightUsed: 110,
        materialCost: 10.89,
        laborCost: 3.5,
        energyCost: 1.8,
        otherCost: 1.2,
        totalCost: 17.39,
        salePrice: 54.9,
        stock: 18,
        weightPerPiece: 110,
        printTimeMinutes: 320,
      },
    }),
  ]);

  console.log("Creating material inventory...");
  await Promise.all([
    prisma.materialInventory.create({
      data: {
        name: "PLA Preto Voolt 1000g",
        type: "PLA",
        brand: "Voolt",
        color: "Preto",
        totalWeight: 1000,
        remainingWeight: 750,
        purchasePrice: 79.9,
        costPerGram: 0.0799,
        purchaseDate: new Date(2026, 0, 5),
      },
    }),
    prisma.materialInventory.create({
      data: {
        name: "PLA Branco 1000g",
        type: "PLA",
        brand: "Voolt",
        color: "Branco",
        totalWeight: 1000,
        remainingWeight: 620,
        purchasePrice: 69.9,
        costPerGram: 0.0699,
        purchaseDate: new Date(2026, 0, 5),
      },
    }),
    prisma.materialInventory.create({
      data: {
        name: "PETG Preto 1000g",
        type: "PETG",
        brand: "Voolt",
        color: "Preto",
        totalWeight: 1000,
        remainingWeight: 830,
        purchasePrice: 89.9,
        costPerGram: 0.0899,
        purchaseDate: new Date(2026, 0, 12),
      },
    }),
    prisma.materialInventory.create({
      data: {
        name: "Resina Standard 500g",
        type: "Resina",
        brand: "Anycubic",
        color: "Cinza",
        totalWeight: 500,
        remainingWeight: 380,
        purchasePrice: 129.9,
        costPerGram: 0.2598,
        purchaseDate: new Date(2026, 1, 10),
      },
    }),
    prisma.materialInventory.create({
      data: {
        name: "TPU Flexível 500g",
        type: "TPU",
        brand: "eSun",
        color: "Preto",
        totalWeight: 500,
        remainingWeight: 350,
        purchasePrice: 119.9,
        costPerGram: 0.2398,
        purchaseDate: new Date(2026, 1, 20),
      },
    }),
    prisma.materialInventory.create({
      data: {
        name: "ASA Branco 1000g",
        type: "ASA",
        brand: "Voolt",
        color: "Branco",
        totalWeight: 1000,
        remainingWeight: 890,
        purchasePrice: 99.9,
        costPerGram: 0.0999,
        purchaseDate: new Date(2026, 2, 1),
      },
    }),
  ]);

  console.log("Creating production runs...");
  const productionRuns = [
    { productId: products[0].id, quantity: 10, materialUsed: 450, printTime: 1200, date: new Date(2026, 0, 15) },
    { productId: products[1].id, quantity: 8, materialUsed: 680, printTime: 1920, date: new Date(2026, 0, 22) },
    { productId: products[2].id, quantity: 15, materialUsed: 825, printTime: 2250, date: new Date(2026, 1, 5) },
    { productId: products[0].id, quantity: 12, materialUsed: 540, printTime: 1440, date: new Date(2026, 1, 14) },
    { productId: products[3].id, quantity: 6, materialUsed: 180, printTime: 1080, date: new Date(2026, 1, 25) },
    { productId: products[4].id, quantity: 10, materialUsed: 600, printTime: 2000, date: new Date(2026, 2, 3) },
    { productId: products[5].id, quantity: 8, materialUsed: 880, printTime: 2560, date: new Date(2026, 2, 15) },
    { productId: products[1].id, quantity: 10, materialUsed: 850, printTime: 2400, date: new Date(2026, 2, 28) },
    { productId: products[0].id, quantity: 15, materialUsed: 675, printTime: 1800, date: new Date(2026, 3, 10) },
    { productId: products[2].id, quantity: 12, materialUsed: 660, printTime: 1800, date: new Date(2026, 3, 22) },
    { productId: products[3].id, quantity: 8, materialUsed: 240, printTime: 1440, date: new Date(2026, 4, 5) },
    { productId: products[5].id, quantity: 10, materialUsed: 1100, printTime: 3200, date: new Date(2026, 5, 1) },
  ];

  for (const run of productionRuns) {
    await prisma.productionRun.create({ data: run });
  }

  console.log("Creating purchases...");
  const purchases = [
    { description: "Filamento PLA Preto Voolt", material: "PLA", quantity: 1000, unitPrice: 0.0799, totalPrice: 79.9, date: new Date(2026, 0, 5) },
    { description: "Filamento PLA Branco Voolt", material: "PLA", quantity: 1000, unitPrice: 0.0699, totalPrice: 69.9, date: new Date(2026, 0, 5) },
    { description: "Filamento PETG Preto Voolt", material: "PETG", quantity: 1000, unitPrice: 0.0899, totalPrice: 89.9, date: new Date(2026, 0, 12) },
    { description: "Resina Anycubic Standard", material: "Resina", quantity: 500, unitPrice: 0.2598, totalPrice: 129.9, date: new Date(2026, 1, 10) },
    { description: "Filamento TPU eSun Flexível", material: "TPU", quantity: 500, unitPrice: 0.2398, totalPrice: 119.9, date: new Date(2026, 1, 20) },
    { description: "Filamento ASA Branco Voolt", material: "ASA", quantity: 1000, unitPrice: 0.0999, totalPrice: 99.9, date: new Date(2026, 2, 1) },
    { description: "Filamento PLA Preto Voolt", material: "PLA", quantity: 1000, unitPrice: 0.0799, totalPrice: 79.9, date: new Date(2026, 3, 10) },
    { description: "Filamento PLA Branco Voolt", material: "PLA", quantity: 1000, unitPrice: 0.0699, totalPrice: 69.9, date: new Date(2026, 4, 1) },
    { description: "Resina Anycubic Standard", material: "Resina", quantity: 500, unitPrice: 0.2598, totalPrice: 129.9, date: new Date(2026, 4, 20) },
    { description: "Filamento PETG Preto Voolt", material: "PETG", quantity: 1000, unitPrice: 0.0899, totalPrice: 89.9, date: new Date(2026, 5, 5) },
  ];

  for (const purchase of purchases) {
    await prisma.purchase.create({ data: purchase });
  }

  console.log("Creating sales...");
  const sales = [
    { productId: products[0].id, customerName: "Carlos Silva", marketplace: "Mercado Livre", quantity: 3, unitPrice: 24.9, totalPrice: 74.7, paymentMethod: "PIX", date: new Date(2026, 0, 20) },
    { productId: products[1].id, customerName: "Ana Oliveira", marketplace: "Shopee", quantity: 2, unitPrice: 39.9, totalPrice: 79.8, paymentMethod: "Cartão de Crédito", date: new Date(2026, 0, 28) },
    { productId: products[2].id, customerName: "Pedro Santos", marketplace: "Amazon", quantity: 5, unitPrice: 29.9, totalPrice: 149.5, paymentMethod: "Boleto", date: new Date(2026, 1, 10) },
    { productId: products[0].id, customerName: "Maria Souza", marketplace: "Mercado Livre", quantity: 4, unitPrice: 24.9, totalPrice: 99.6, paymentMethod: "PIX", date: new Date(2026, 1, 18) },
    { productId: products[3].id, customerName: "Lucas Costa", marketplace: "Loja Própria", quantity: 1, unitPrice: 49.9, totalPrice: 49.9, paymentMethod: "Dinheiro", date: new Date(2026, 2, 2) },
    { productId: products[4].id, customerName: "Fernanda Lima", marketplace: "Shopee", quantity: 2, unitPrice: 59.9, totalPrice: 119.8, paymentMethod: "Cartão de Crédito", date: new Date(2026, 2, 12) },
    { productId: products[1].id, customerName: "Rafael Almeida", marketplace: "Amazon", quantity: 3, unitPrice: 39.9, totalPrice: 119.7, paymentMethod: "PIX", date: new Date(2026, 2, 25) },
    { productId: products[5].id, customerName: "Juliana Ferreira", marketplace: "Mercado Livre", quantity: 2, unitPrice: 54.9, totalPrice: 109.8, paymentMethod: "Cartão de Crédito", date: new Date(2026, 3, 5) },
    { productId: products[0].id, customerName: "Gabriel Ribeiro", marketplace: "Loja Própria", quantity: 6, unitPrice: 24.9, totalPrice: 149.4, paymentMethod: "PIX", date: new Date(2026, 3, 15) },
    { productId: products[2].id, customerName: "Camila Martins", marketplace: "Shopee", quantity: 4, unitPrice: 29.9, totalPrice: 119.6, paymentMethod: "Boleto", date: new Date(2026, 4, 8) },
    { productId: products[3].id, customerName: "Thiago Nunes", marketplace: "Amazon", quantity: 3, unitPrice: 49.9, totalPrice: 149.7, paymentMethod: "Cartão de Crédito", date: new Date(2026, 4, 20) },
    { productId: products[4].id, customerName: "Beatriz Araújo", marketplace: "Mercado Livre", quantity: 2, unitPrice: 59.9, totalPrice: 119.8, paymentMethod: "PIX", date: new Date(2026, 5, 3) },
    { productId: products[0].id, customerName: "Rodrigo Barbosa", marketplace: "Loja Própria", quantity: 5, unitPrice: 24.9, totalPrice: 124.5, paymentMethod: "Dinheiro", date: new Date(2026, 5, 10) },
    { productId: products[5].id, customerName: "Patrícia Dias", marketplace: "Shopee", quantity: 3, unitPrice: 54.9, totalPrice: 164.7, paymentMethod: "Cartão de Crédito", date: new Date(2026, 5, 15) },
    { productId: products[1].id, customerName: "Felipe Gomes", marketplace: "Amazon", quantity: 2, unitPrice: 39.9, totalPrice: 79.8, paymentMethod: "PIX", date: new Date(2026, 5, 20) },
  ];

  for (const sale of sales) {
    await prisma.sale.create({ data: sale });
  }

  console.log("Seed completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
