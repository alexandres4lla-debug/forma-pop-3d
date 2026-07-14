"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
}

interface ProductionRun {
  id: string;
  productId: string;
  quantity: number;
  materialUsed: number;
  printTime: number;
  status: string;
  notes: string;
  date: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    salePrice: number;
    totalCost: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "falha", label: "Falha" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  falha: "Falha",
  cancelado: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  concluido:
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  em_andamento:
    "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  falha:
    "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  cancelado:
    "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400",
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

async function fetchPage(
  page: number,
  search: string,
  status: string,
  setter: (runs: ProductionRun[], p: Pagination) => void,
  loadingSetter: (v: boolean) => void
) {
  loadingSetter(true);
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/producao?${params}`);
    if (res.ok) {
      const data = await res.json();
      setter(data.productionRuns, data.pagination);
    }
  } finally {
    loadingSetter(false);
  }
}

const EMPTY_FORM = {
  productId: "",
  quantity: 1,
  materialUsed: 0,
  printTime: 0,
  status: "em_andamento",
  notes: "",
  date: new Date().toISOString().split("T")[0],
};

export default function ProducaoPage() {
  const [runs, setRuns] = React.useState<ProductionRun[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchPage(
      page,
      search,
      status,
      (r, p) => {
        setRuns(r);
        setPagination(p);
      },
      setLoading
    );
  }, [page, search, status]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/produtos?limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProducts(data.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreateDialog() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(run: ProductionRun) {
    setEditingId(run.id);
    setForm({
      productId: run.productId,
      quantity: run.quantity,
      materialUsed: run.materialUsed,
      printTime: run.printTime,
      status: run.status,
      notes: run.notes ?? "",
      date: run.date ? run.date.split("T")[0] : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/producao/${editingId}`
        : "/api/producao";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          quantity: Number(form.quantity),
          materialUsed: Number(form.materialUsed),
          printTime: Number(form.printTime),
          status: form.status,
          notes: form.notes,
          date: form.date,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchPage(
          page,
          search,
          status,
          (r, p) => {
            setRuns(r);
            setPagination(p);
          },
          setLoading
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta produção?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/producao/${id}`, { method: "DELETE" });
      if (res.ok)
        fetchPage(
          page,
          search,
          status,
          (r, p) => {
            setRuns(r);
            setPagination(p);
          },
          setLoading
        );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produção</h1>
          <p className="text-muted-foreground mt-1">
            Controle de impressões e produção de peças
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Nova Produção
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </form>
            <Select
              value={status ?? ""}
              onValueChange={(v) => {
                setStatus(v ?? "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Material</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma produção encontrada
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {run.product?.name ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {run.product?.sku ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {run.materialUsed}g
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {formatTime(run.printTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_STYLES[run.status] ?? ""}
                        variant="outline"
                      >
                        {STATUS_LABELS[run.status] ?? run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDate(run.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(run)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(run.id)}
                          disabled={deletingId === run.id}
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

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm tabular-nums">
                Página {pagination.page} de {pagination.totalPages}
              </span>
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
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Produção" : "Nova Produção"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Product Select */}
            <div className="grid gap-2">
              <Label>Produto</Label>
              <Select
                value={form.productId ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, productId: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity & Material */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Material (g)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.materialUsed}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      materialUsed: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            {/* Print Time & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tempo (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.printTime}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      printTime: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status ?? ""}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v ?? "em_andamento" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Notas sobre a produção..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.productId}
            >
              {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
