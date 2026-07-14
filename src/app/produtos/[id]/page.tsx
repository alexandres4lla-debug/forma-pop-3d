"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Clock,
  Weight,
  DollarSign,
  ShoppingCart,
  Factory,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductionRun {
  id: string;
  quantity: number;
  materialUsed: number;
  printTime: number;
  status: string;
  date: string;
  notes: string | null;
}

interface Sale {
  id: string;
  customerName: string;
  marketplace: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  photo: string | null;
  photos: string[] | null;
  materialType: string | null;
  materialBrand: string | null;
  materialColor: string | null;
  materialWeightUsed: number | null;
  materialCost: number;
  laborCost: number;
  energyCost: number;
  otherCost: number;
  totalCost: number;
  salePrice: number;
  stock: number;
  weightPerPiece: number | null;
  printTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  productionRuns: ProductionRun[];
  sales: Sale[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function getMargin(salePrice: number, totalCost: number): number {
  if (salePrice === 0) return 0;
  return ((salePrice - totalCost) / salePrice) * 100;
}

function getStockColor(stock: number): string {
  if (stock === 0)
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (stock < 5)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "concluído" || s === "concluido" || s === "completed")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s === "em andamento" || s === "in progress")
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (s === "cancelado" || s === "canceled")
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (s === "pendente" || s === "pending")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-secondary text-secondary-foreground";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-24 bg-muted rounded" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 h-80 bg-muted rounded-2xl" />
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded" />
          </div>
          <div className="h-16 w-32 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export default function ProdutoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/produtos/${id}`);
        if (!res.ok) throw new Error("Produto não encontrado");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link href="/produtos">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Package className="size-10 mb-3 opacity-50" />
            <p className="text-sm">{error || "Produto não encontrado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const margin = getMargin(product.salePrice, product.totalCost);
  const showProductionInfo =
    (product.materialWeightUsed && product.materialWeightUsed > 0) ||
    (product.printTimeMinutes && product.printTimeMinutes > 0);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/produtos">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
      </Link>

      {/* Product Hero Section */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* LEFT: Photo */}
        <div className="lg:col-span-3">
          {product.photo ? (
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img
                src={product.photo}
                alt={product.name}
                className="w-full h-auto max-h-[480px] object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center">
              <Package className="size-20 text-muted-foreground/30" />
            </div>
          )}
          {/* Additional photos */}
          {product.photos && product.photos.length > 0 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {product.photos.map((photo, i) => (
                <div
                  key={i}
                  className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border/50"
                >
                  <img
                    src={photo}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Name */}
          <h1 className="text-3xl font-extrabold tracking-tight">
            {product.name}
          </h1>

          {/* SKU */}
          {product.sku && (
            <Badge variant="secondary" className="font-mono text-xs">
              {product.sku}
            </Badge>
          )}

          {/* Material badges */}
          <div className="flex flex-wrap gap-2">
            {product.materialType && (
              <Badge variant="outline" className="gap-1">
                <Factory className="size-3" />
                {product.materialType}
              </Badge>
            )}
            {product.materialBrand && (
              <Badge variant="outline">{product.materialBrand}</Badge>
            )}
            {product.materialColor && (
              <Badge variant="outline" className="gap-1.5">
                <span
                  className="size-2.5 rounded-full border border-border/50"
                  style={{ backgroundColor: product.materialColor }}
                />
                {product.materialColor}
              </Badge>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Estoque:</span>
            <span
              className={`text-lg font-bold px-3 py-1 rounded-lg ${getStockColor(product.stock)}`}
            >
              {product.stock} {product.stock === 1 ? "unidade" : "unidades"}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(product.salePrice)}
            </span>
            {product.salePrice > 0 && (
              <Badge
                variant={margin >= 30 ? "default" : margin >= 0 ? "secondary" : "destructive"}
              >
                Margem: {margin.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Cost summary */}
          <div className="text-sm text-muted-foreground">
            Custo total:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(product.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-4" />
              Decomposição de Custos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Material</span>
              <span className="font-medium">{formatCurrency(product.materialCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mão de obra</span>
              <span className="font-medium">{formatCurrency(product.laborCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Energia</span>
              <span className="font-medium">{formatCurrency(product.energyCost)}</span>
            </div>
            {product.otherCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outros</span>
                <span className="font-medium">{formatCurrency(product.otherCost)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(product.totalCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Production Info Card */}
        {showProductionInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Informações de Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.weightPerPiece && product.weightPerPiece > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                    <Weight className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso por peça</p>
                    <p className="font-semibold">{product.weightPerPiece}g</p>
                  </div>
                </div>
              )}
              {product.printTimeMinutes && product.printTimeMinutes > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                    <Clock className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo estimado</p>
                    <p className="font-semibold">{formatTime(product.printTimeMinutes)}</p>
                  </div>
                </div>
              )}
              {product.materialWeightUsed && product.materialWeightUsed > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                    <Factory className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Material utilizado</p>
                    <p className="font-semibold">{product.materialWeightUsed}g</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Production History */}
      {product.productionRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="size-4" />
              Histórico de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Material (g)</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.productionRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(run.date)}
                    </TableCell>
                    <TableCell className="font-medium">{run.quantity}</TableCell>
                    <TableCell>{run.materialUsed}g</TableCell>
                    <TableCell>{formatTime(run.printTime)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(run.status)}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {run.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sales History */}
      {product.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Histórico de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(sale.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.marketplace}</Badge>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sale.totalPrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(sale.unitPrice)} /un
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
