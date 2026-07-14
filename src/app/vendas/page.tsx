"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface Sale {
  id: string;
  productId: string | null;
  customerName: string;
  marketplace: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
  date: string;
  notes: string;
  createdAt: string;
  product: Product | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SalesResponse {
  sales: Sale[];
  pagination: Pagination;
}

interface ProductsResponse {
  products: Product[];
}

const EMPTY_FORM = {
  productId: "",
  customerName: "",
  marketplace: "",
  quantity: 1,
  unitPrice: 0,
  paymentMethod: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

const MARKETPLACE_COLORS: Record<string, string> = {
  "Mercado Livre": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-0",
  Shopee: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-0",
  Instagram: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-0",
  Direto: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0",
  Outro: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-0",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/vendas?${params}`);
      if (res.ok) {
        const data: SalesResponse = await res.json();
        setSales(data.sales);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/produtos?limit=100");
    if (res.ok) {
      const data: ProductsResponse = await res.json();
      setProducts(data.products);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const summary = useMemo(() => {
    const total = sales.length;
    const revenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const avg = total > 0 ? revenue / total : 0;
    const now = new Date();
    const thisMonth = sales.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      totalCount: pagination.total,
      totalRevenue: revenue,
      averageTicket: avg,
      thisMonthCount: thisMonth.length,
    };
  }, [sales, pagination.total]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId]
  );

  const totalCalc = useMemo(
    () => form.quantity * form.unitPrice,
    [form.quantity, form.unitPrice]
  );

  const stockWarning =
    selectedProduct && form.quantity > selectedProduct.stock;

  function openCreate() {
    setEditingSale(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setDialogOpen(true);
  }

  function openEdit(sale: Sale) {
    setEditingSale(sale);
    setForm({
      productId: sale.productId ?? "",
      customerName: sale.customerName,
      marketplace: sale.marketplace,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      paymentMethod: sale.paymentMethod,
      date: sale.date,
      notes: sale.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        productId: form.productId || null,
        customerName: form.customerName,
        marketplace: form.marketplace,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        paymentMethod: form.paymentMethod,
        date: form.date,
        notes: form.notes,
      };
      const url = editingSale ? `/api/vendas/${editingSale.id}` : "/api/vendas";
      const method = editingSale ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchSales();
        fetchProducts();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vendas/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSales();
        fetchProducts();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de vendas e pedidos
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nova Venda
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vendas
            </CardTitle>
            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
              <TrendingUp className="size-4 text-emerald-500 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <div className="rounded-lg bg-violet-50 p-2 dark:bg-violet-950/40">
              <TrendingUp className="size-4 text-violet-500 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/40">
              <TrendingUp className="size-4 text-blue-500 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.averageTicket)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas este Mês
            </CardTitle>
            <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-950/40">
              <TrendingUp className="size-4 text-orange-500 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.thisMonthCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={8}>
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.product?.name ?? (
                        <span className="text-muted-foreground italic">
                          Sem produto vinculado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          MARKETPLACE_COLORS[sale.marketplace] ??
                          MARKETPLACE_COLORS["Outro"]
                        }
                      >
                        {sale.marketplace}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sale.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(sale)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(sale.id)}
                          disabled={deletingId === sale.id}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? "Editar Venda" : "Nova Venda"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select
                value={form.productId || null}
                onValueChange={(v) => setForm((f) => ({ ...f, productId: v ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sem produto vinculado" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.stock} em estoque
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente</Label>
              <Input
                id="customerName"
                required
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Canal de Venda</Label>
              <Select
                value={form.marketplace || null}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, marketplace: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Direto">Direto</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Preço Unitário R$</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      unitPrice: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total</Label>
              <Input
                readOnly
                value={formatCurrency(totalCalc)}
                className="font-semibold bg-muted"
              />
            </div>

            {stockWarning && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-0 gap-1">
                <AlertTriangle className="size-3" />
                Estoque insuficiente ({selectedProduct?.stock} disponível)
              </Badge>
            )}

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={form.paymentMethod || null}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, paymentMethod: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de Crédito">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="Cartão de Débito">
                    Cartão de Débito
                  </SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                required
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : editingSale ? "Salvar" : "Criar Venda"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
