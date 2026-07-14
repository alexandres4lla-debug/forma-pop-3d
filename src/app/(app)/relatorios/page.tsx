"use client";

import * as React from "react";
import { BarChart3, TrendingUp, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

interface ProductionData {
  type: "production";
  summary: {
    totalRuns: number;
    totalMaterialUsed: number;
    totalPrintTime: number;
    statusBreakdown: { status: string; count: number }[];
  };
  monthlyProduction: { month: string; count: number }[];
  runs: {
    id: string;
    productName: string;
    quantity: number;
    materialUsed: number;
    printTime: number;
    status: string;
    date: string;
  }[];
}

interface FinancialData {
  type: "financial";
  summary: {
    totalRevenue: number;
    totalCosts: number;
    profit: number;
    salesCount: number;
    purchasesCount: number;
  };
  monthlyFinancial: { month: string; revenue: number; costs: number }[];
  sales: {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    date: string;
  }[];
  purchases: {
    id: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    date: string;
  }[];
}

interface InventoryData {
  type: "inventory";
  summary: {
    totalProducts: number;
    totalStock: number;
    totalStockValue: number;
    lowStockCount: number;
  };
  lowStockProducts: { id: string; name: string; stock: number }[];
  stockByProduct: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    totalValue: number;
    costPerUnit: number;
    salePrice: number;
    margin: string;
  }[];
}

type ReportData = ProductionData | FinancialData | InventoryData;

const statusConfig: Record<string, { label: string; color: string }> = {
  concluido: { label: "Concluído", color: "bg-green-500" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500" },
  falha: { label: "Falha", color: "bg-red-500" },
  cancelado: { label: "Cancelado", color: "bg-gray-400" },
};

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = React.useState("production");
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const today = new Date().toISOString().split("T")[0];
  const defaultStart = new Date(
    new Date().setMonth(new Date().getMonth() - 6)
  )
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = React.useState(defaultStart);
  const [endDate, setEndDate] = React.useState(today);

  const fetchReport = React.useCallback(
    async (type: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type,
          startDate,
          endDate,
        });
        const res = await fetch(`/api/relatorios?${params}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  React.useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Análises e indicadores do negócio
        </p>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Data inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">Data final</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button onClick={() => fetchReport(activeTab)} disabled={loading}>
          Gerar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="production">Produção</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">Carregando relatório...</div>
          </div>
        )}

        {!loading && !data && (
          <div className="flex items-center justify-center py-16">
            <div className="text-muted-foreground">
              Clique em &quot;Gerar&quot; para carregar os dados
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            <TabsContent value="production">
              {data.type === "production" && (
                <ProductionReport data={data} />
              )}
            </TabsContent>

            <TabsContent value="financial">
              {data.type === "financial" && (
                <FinancialReport data={data} />
              )}
            </TabsContent>

            <TabsContent value="inventory">
              {data.type === "inventory" && (
                <InventoryReport data={data} />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function ProductionReport({ data }: { data: ProductionData }) {
  const { summary, monthlyProduction } = data;
  const maxMonthly = Math.max(...monthlyProduction.map((m) => m.count), 1);
  const totalFromBreakdown = summary.statusBreakdown.reduce(
    (acc, s) => acc + s.count,
    0
  );

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produções
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRuns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Material Total
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalMaterialUsed.toFixed(1)}g
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(summary.totalPrintTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Status das Produções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.statusBreakdown.map((item) => {
              const config = statusConfig[item.status] || {
                label: item.status,
                color: "bg-gray-400",
              };
              const pct =
                totalFromBreakdown > 0
                  ? (item.count / totalFromBreakdown) * 100
                  : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-muted-foreground">
                    {config.label}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs font-medium text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Produção Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthlyProduction.map((item) => (
              <div key={item.month} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground">
                  {item.month}
                </span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${maxMonthly > 0 ? (item.count / maxMonthly) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-xs font-medium text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialReport({ data }: { data: FinancialData }) {
  const { summary, monthlyFinancial, sales, purchases } = data;
  const maxMonthly = Math.max(
    ...monthlyFinancial.map((m) => Math.max(m.revenue, m.costs)),
    1
  );
  const profitMargin =
    summary.totalRevenue > 0
      ? ((summary.profit / summary.totalRevenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custos Totais
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalCosts)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lucro Líquido
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {formatCurrency(summary.profit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem %</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${Number(profitMargin) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {profitMargin}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Receita vs Custos Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyFinancial.map((item) => (
              <div key={item.month} className="space-y-1.5">
                <span className="text-xs text-muted-foreground">
                  {item.month}
                </span>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground">
                    Receita
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${maxMonthly > 0 ? (item.revenue / maxMonthly) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 text-xs font-medium text-right">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground">
                    Custos
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{
                        width: `${maxMonthly > 0 ? (item.costs / maxMonthly) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 text-xs font-medium text-right">
                    {formatCurrency(item.costs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Últimas Vendas
            </CardTitle>
            <CardDescription>{summary.salesCount} vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda no período
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sales.slice(0, 10).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {sale.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.quantity}x • {formatDate(sale.date)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(sale.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Últimas Compras
            </CardTitle>
            <CardDescription>
              {summary.purchasesCount} compras no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma compra no período
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {purchases.slice(0, 10).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {purchase.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {purchase.quantity}x • {formatDate(purchase.date)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      -{formatCurrency(purchase.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InventoryReport({ data }: { data: InventoryData }) {
  const { summary, stockByProduct, lowStockProducts } = data;
  const maxStock = Math.max(
    ...stockByProduct.map((p) => p.stock),
    1
  );

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estoque Total
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalStockValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estoque Baixo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.lowStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Estoque por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockByProduct.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum produto cadastrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Custo/Un.</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockByProduct.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.sku}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${maxStock > 0 ? (product.stock / maxStock) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {product.stock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.costPerUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          Number(product.margin) >= 30
                            ? "default"
                            : Number(product.margin) >= 15
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {product.margin}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Alertas de Estoque Baixo
            </CardTitle>
            <CardDescription>
              Produtos com estoque inferior a 5 unidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <Badge variant="destructive">
                    {product.stock} {product.stock === 1 ? "unidade" : "unidades"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
