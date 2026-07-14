"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Wallet,
  ShoppingCart,
  Factory,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";

interface DashboardData {
  totalProducts: number;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  productsLowStock: Array<{
    id: string;
    name: string;
    stock: number;
    photo?: string;
  }>;
  thisMonthSales: { total: number; count: number };
  thisMonthPurchases: { total: number; count: number };
  thisMonthProduction: number;
  monthlySales: Array<{ month: string; total: number; count: number }>;
  monthlyPurchases: Array<{ month: string; total: number; count: number }>;
  recentActivity: Array<{
    type: "sale" | "purchase" | "production";
    id: string;
    description: string;
    amount: number;
    date: string;
    details: string;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    salesCount: number;
    photo?: string;
    materialType?: string;
  }>;
  totalMaterialWeight: number;
  totalPrintTime: number;
  filamentConsumed: number;
}

const PERIODS = [
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 60 dias", days: 60 },
  { label: "Últimos 90 dias", days: 90 },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatRelativeDate(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 30) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const fetchDashboard = useCallback((days: number) => {
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    fetch(`/api/dashboard?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar dados");
        return res.json();
      })
      .then((d: DashboardData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Erro ao carregar dashboard", {
          description: err.message,
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboard(selectedPeriod);
  }, [selectedPeriod, fetchDashboard]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonPulse className="h-10 w-52" />
            <SkeletonPulse className="h-4 w-40" />
          </div>
          <SkeletonPulse className="h-9 w-9 rounded-lg" />
        </div>

        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <SkeletonPulse key={p.days} className="h-9 w-36" />
          ))}
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <SkeletonPulse className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <SkeletonPulse className="h-9 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <SkeletonPulse className="h-4 w-28 mb-2" />
                <SkeletonPulse className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <SkeletonPulse className="h-5 w-44" />
              <SkeletonPulse className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonPulse className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SkeletonPulse className="h-5 w-44" />
              <SkeletonPulse className="h-3 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonPulse className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonPulse className="h-4 w-32" />
                      <SkeletonPulse className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <SkeletonPulse className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-muted-foreground">
          Erro ao carregar dados do dashboard.
        </p>
      </div>
    );
  }

  const profitMargin =
    data.totalRevenue > 0
      ? ((data.profit / data.totalRevenue) * 100).toFixed(1)
      : "0.0";

  const kpiCards = [
    {
      title: "Receita Total",
      value: formatCurrency(data.totalRevenue),
      icon: TrendingUp,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-500/20",
    },
    {
      title: "Custos Totais",
      value: formatCurrency(data.totalCosts),
      icon: DollarSign,
      accent: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      ring: "ring-orange-500/20",
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(data.profit),
      icon: Wallet,
      accent:
        data.profit >= 0
          ? "text-violet-500 dark:text-violet-400"
          : "text-red-500 dark:text-red-400",
      bg:
        data.profit >= 0
          ? "bg-violet-50 dark:bg-violet-950/40"
          : "bg-red-50 dark:bg-red-950/40",
      ring: data.profit >= 0 ? "ring-violet-500/20" : "ring-red-500/20",
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin}%`,
      icon: TrendingUp,
      accent: "text-teal-500 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      ring: "ring-teal-500/20",
    },
  ];

  const secondaryKpis = [
    {
      title: "Produções",
      value: data.thisMonthProduction,
      icon: Factory,
      accent: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Produtos Cadastrados",
      value: data.totalProducts,
      icon: Package,
      accent: "text-muted-foreground",
      bg: "bg-muted/50",
    },
    {
      title: "Filamento Consumido",
      value: `${data.filamentConsumed}g`,
      icon: Layers,
      accent: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  const maxRevenue = Math.max(...data.topProducts.map((p) => p.revenue), 1);

  const chartData = data.monthlySales.map((sale, i) => ({
    month: sale.month,
    Vendas: sale.total,
    Compras: data.monthlyPurchases[i]?.total ?? 0,
  }));

  const activityConfig = {
    sale: {
      icon: TrendingUp,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      dot: "bg-emerald-500",
      badge: "Venda",
      badgeClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0",
    },
    purchase: {
      icon: ShoppingCart,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      dot: "bg-orange-500",
      badge: "Compra",
      badgeClass:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-0",
    },
    production: {
      icon: Factory,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      dot: "bg-blue-500",
      badge: "Produção",
      badgeClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0",
    },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Date Range Filter Bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">
              Período:
            </span>
            {PERIODS.map((period) => (
              <Button
                key={period.days}
                variant={
                  selectedPeriod === period.days ? "default" : "outline"
                }
                size="sm"
                onClick={() => handlePeriodChange(period.days)}
                className={
                  selectedPeriod === period.days
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {secondaryKpis.map((kpi) => (
          <Card key={kpi.title} className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 shrink-0 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Receita vs Custos
            </CardTitle>
            <CardDescription>
              Comparativo mensal de vendas e compras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : v.toFixed(0)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="Vendas"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="Compras"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Produtos Mais Vendidos
            </CardTitle>
            <CardDescription>Por receita total</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum produto vendido ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {data.topProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 card-hover rounded-lg p-2 -mx-2"
                  >
                    {product.photo ? (
                      <img
                        src={product.photo}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {product.name}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground ml-2 shrink-0">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-400 dark:bg-violet-500 transition-all"
                            style={{
                              width: `${(product.revenue / maxRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {product.salesCount} venda
                          {product.salesCount !== 1 && "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {data.productsLowStock.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              <CardTitle className="text-base font-semibold">
                Estoque Baixo
              </CardTitle>
              <Badge
                variant="secondary"
                className="ml-auto font-semibold text-xs"
              >
                {data.productsLowStock.length} produto
                {data.productsLowStock.length !== 1 && "s"}
              </Badge>
            </div>
            <CardDescription>
              Produtos com estoque crítico que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.productsLowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg border p-3 card-hover"
                >
                  {product.photo ? (
                    <img
                      src={product.photo}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          product.stock === 0
                            ? "bg-red-500"
                            : product.stock <= 2
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {product.stock} un.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas movimentações registradas
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            {data.recentActivity.length} registro
            {data.recentActivity.length !== 1 && "s"}
          </Badge>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade registrada.
            </p>
          ) : (
            <div className="space-y-1">
              {data.recentActivity.map((activity, idx) => {
                const cfg = activityConfig[activity.type];
                const Icon = cfg.icon;

                return (
                  <div
                    key={`${activity.id}-${idx}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors cursor-default"
                  >
                    <div
                      className={`rounded-lg p-2 shrink-0 ${cfg.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cfg.badgeClass}
                        >
                          {cfg.badge}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {activity.description}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          activity.type === "sale"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : activity.type === "purchase"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-foreground"
                        }`}
                      >
                        {activity.type === "purchase" ? "-" : ""}
                        {activity.type !== "production"
                          ? formatCurrency(activity.amount)
                          : `${activity.amount} un.`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(activity.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
