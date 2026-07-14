"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Purchase {
  id: string;
  description: string;
  material: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightGrams?: number;
  date: string;
  notes: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PurchasesResponse {
  purchases: Purchase[];
  pagination: Pagination;
}

interface FormData {
  description: string;
  material: string;
  quantity: number;
  unitPrice: number;
  weightGrams: number;
  date: string;
  notes: string;
}

const emptyForm: FormData = {
  description: "",
  material: "",
  quantity: 1,
  unitPrice: 0,
  weightGrams: 0,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function ComprasPage() {
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const fetchPurchases = React.useCallback(async (page: number = 1, q: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (q) params.set("search", q);
      const res = await fetch(`/api/compras?${params}`);
      const data: PurchasesResponse = await res.json();
      setPurchases(data.purchases);
      setPagination(data.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPurchases(pagination.page, search);
  }, []);

  const handleSearch = () => {
    fetchPurchases(1, search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (purchase: Purchase) => {
    setEditingId(purchase.id);
    setForm({
      description: purchase.description,
      material: purchase.material,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      weightGrams: (purchase as any).weightGrams || 0,
      date: purchase.date.split("T")[0],
      notes: purchase.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        description: form.description,
        material: form.material,
        quantity: 1,
        unitPrice: form.unitPrice,
        weightGrams: form.weightGrams,
        totalPrice: form.unitPrice,
        date: form.date,
        notes: form.notes,
      };

      if (editingId) {
        await fetch(`/api/compras/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setDialogOpen(false);
      fetchPurchases(pagination.page, search);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta compra?")) return;
    try {
      await fetch(`/api/compras/${id}`, { method: "DELETE" });
      fetchPurchases(pagination.page, search);
    } catch {
      // silent
    }
  };

  const parseNumber = (v: string) => {
    const cleaned = v.replace(/,/g, ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalValue = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
  const purchasesThisMonth = purchases.filter((p) => {
    const d = new Date(p.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground mt-1">
            Registro de materiais e insumos para impressão 3D
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Compra
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar compras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras este Mês</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchasesThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>R$/g</TableHead>
                <TableHead>R$/kg</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma compra encontrada
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{purchase.material}</Badge>
                    </TableCell>
                    <TableCell>
                      {purchase.weightGrams ? `${purchase.weightGrams}g` : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(purchase.totalPrice)}
                    </TableCell>
                    <TableCell className="text-teal-600 dark:text-teal-400 font-medium">
                      {purchase.weightGrams
                        ? formatCurrency(purchase.totalPrice / purchase.weightGrams)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-teal-600 dark:text-teal-400 font-medium">
                      {purchase.weightGrams
                        ? formatCurrency((purchase.totalPrice / purchase.weightGrams) * 1000)
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(purchase.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(purchase)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchPurchases(pagination.page - 1, search)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchPurchases(pagination.page + 1, search)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Compra" : "Nova Compra"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ex: Filamento PLA 1.75mm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="material">Material *</Label>
              <Input
                id="material"
                value={form.material}
                onChange={(e) => updateField("material", e.target.value)}
                placeholder="Ex: Filamento PLA, Resina UV, PEEK"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="weightGrams">Peso (gramas) *</Label>
                <Input
                  id="weightGrams"
                  type="text"
                  inputMode="numeric"
                  min={0}
                  value={form.weightGrams || ""}
                  onChange={(e) => updateField("weightGrams", parseNumber(e.target.value))}
                  placeholder="Ex: 1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalPriceInput">Valor Total R$ *</Label>
                <Input
                  id="totalPriceInput"
                  type="text"
                  inputMode="decimal"
                  min={0}
                  value={form.unitPrice || ""}
                  onChange={(e) => updateField("unitPrice", parseNumber(e.target.value))}
                  placeholder="Ex: 68,48"
                />
              </div>
            </div>
            {form.weightGrams > 0 && form.unitPrice > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo por grama</span>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(form.unitPrice / form.weightGrams)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo por kg</span>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency((form.unitPrice / form.weightGrams) * 1000)}
                  </span>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.description || !form.material}>
              {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
