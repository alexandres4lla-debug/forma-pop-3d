"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Eye,
  Grid3X3,
  List,
  ImagePlus,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  photo: string | null;
  photos: string | null;
  materialType: string | null;
  materialBrand: string | null;
  materialColor: string | null;
  materialWeightUsed: number;
  materialCost: number;
  laborCost: number;
  energyCost: number;
  otherCost: number;
  totalCost: number;
  salePrice: number;
  stock: number;
  weightPerPiece: number;
  printTimeMinutes: number;
  createdAt: string;
  _count: { productionRuns: number; sales: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FormData {
  name: string;
  sku: string;
  description: string;
  photo: string;
  materialType: string;
  materialBrand: string;
  materialColor: string;
  materialWeightUsed: number;
  weightPerPiece: number;
  printTimeMinutes: number;
  materialCost: number;
  laborCost: number;
  energyCost: number;
  otherCost: number;
  salePrice: number;
  stock: number;
}

const defaultFormData: FormData = {
  name: "",
  sku: "",
  description: "",
  photo: "",
  materialType: "",
  materialBrand: "",
  materialColor: "",
  materialWeightUsed: 0,
  weightPerPiece: 0,
  printTimeMinutes: 0,
  materialCost: 0,
  laborCost: 0,
  energyCost: 0,
  otherCost: 0,
  salePrice: 0,
  stock: 0,
};

const MATERIAL_OPTIONS = ["PLA", "PETG", "ABS", "TPU", "ASA", "Nylon", "Outro"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPrintTime(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function getMargin(salePrice: number, totalCost: number): number {
  if (salePrice === 0) return 0;
  return ((salePrice - totalCost) / salePrice) * 100;
}

function getMarginVariant(margin: number): "default" | "secondary" | "destructive" {
  if (margin >= 30) return "default";
  if (margin >= 0) return "secondary";
  return "destructive";
}

function getStockDotColor(stock: number): string {
  if (stock === 0) return "bg-red-500";
  if (stock < 5) return "bg-yellow-500";
  return "bg-green-500";
}

export default function ProdutosPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [pagination, setPagination] = React.useState<Pagination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formData, setFormData] = React.useState<FormData>(defaultFormData);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = React.useState<Array<{ type: string; color?: string | null; costPerGram: number; name: string }>>([]);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "12",
      });
      const res = await fetch(`/api/produtos?${params}`);
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    if (dialogOpen) {
      fetch("/api/material-inventory")
        .then((r) => r.json())
        .then((d) => setMaterials(d.materials || []))
        .catch(() => {});
    }
  }, [dialogOpen]);

  React.useEffect(() => {
    if (formData.materialType && formData.materialWeightUsed > 0 && materials.length > 0) {
      const match = materials.find(
        (m) => m.type === formData.materialType && (!formData.materialColor || !m.color || m.color === formData.materialColor)
      );
      if (match) {
        const cost = formData.materialWeightUsed * match.costPerGram;
        setFormData((prev) => ({ ...prev, materialCost: Math.round(cost * 100) / 100 }));
      }
    }
  }, [formData.materialType, formData.materialColor, formData.materialWeightUsed, materials]);

  const computedTotal = formData.materialCost + formData.laborCost + formData.energyCost + formData.otherCost;
  const margin = getMargin(formData.salePrice, computedTotal);

  function openCreateDialog() {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku ?? "",
      description: product.description ?? "",
      photo: product.photo ?? "",
      materialType: product.materialType ?? "",
      materialBrand: product.materialBrand ?? "",
      materialColor: product.materialColor ?? "",
      materialWeightUsed: product.materialWeightUsed,
      weightPerPiece: product.weightPerPiece,
      printTimeMinutes: product.printTimeMinutes,
      materialCost: product.materialCost,
      laborCost: product.laborCost,
      energyCost: product.energyCost,
      otherCost: product.otherCost,
      salePrice: product.salePrice,
      stock: product.stock,
    });
    setDialogOpen(true);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setFormData((prev) => ({ ...prev, photo: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const body = {
      name: formData.name,
      sku: formData.sku || null,
      description: formData.description || null,
      photo: formData.photo || null,
      materialType: formData.materialType || null,
      materialBrand: formData.materialBrand || null,
      materialColor: formData.materialColor || null,
      materialWeightUsed: formData.materialWeightUsed,
      weightPerPiece: formData.weightPerPiece,
      printTimeMinutes: formData.printTimeMinutes,
      materialCost: formData.materialCost,
      laborCost: formData.laborCost,
      energyCost: formData.energyCost,
      otherCost: formData.otherCost,
      totalCost: computedTotal,
      salePrice: formData.salePrice,
      stock: formData.stock,
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/produtos/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success("Produto atualizado com sucesso");
      } else {
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success("Produto criado com sucesso");
      }
      setDialogOpen(false);
      fetchProducts();
    } catch {
      toast.error(editingProduct ? "Erro ao atualizar produto" : "Erro ao criar produto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Produto excluído");
      setDeleteConfirmId(null);
      fetchProducts();
    } catch {
      toast.error("Erro ao excluir produto");
    }
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de peças para impressão 3D
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-1.5 self-start">
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5 self-start">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="size-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("table")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="skeleton h-48 w-full rounded-none" />
              <CardContent className="space-y-3 pt-4">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Package className="size-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1">Crie um novo produto para começar</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const prodMargin = getMargin(product.salePrice, product.totalCost);
            return (
              <Card key={product.id} className="card-hover flex flex-col overflow-hidden">
                {/* Photo Section */}
                {product.photo ? (
                  <img
                    src={product.photo}
                    alt={product.name}
                    className="h-48 w-full object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-t-xl bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
                    <Package className="size-12 text-primary/30" />
                  </div>
                )}

                {/* Content Section */}
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  {/* Name + SKU */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold leading-snug">{product.name}</h3>
                    {product.sku && (
                      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                        {product.sku}
                      </Badge>
                    )}
                  </div>

                  {/* Material Info */}
                  {(product.materialType || product.materialBrand || product.materialColor) && (
                    <div className="flex flex-wrap gap-1">
                      {product.materialType && (
                        <Badge variant="outline" className="text-xs">{product.materialType}</Badge>
                      )}
                      {product.materialBrand && (
                        <Badge variant="outline" className="text-xs">{product.materialBrand}</Badge>
                      )}
                      {product.materialColor && (
                        <Badge variant="outline" className="text-xs">{product.materialColor}</Badge>
                      )}
                    </div>
                  )}

                  {/* Material Weight + Print Time */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {product.materialWeightUsed > 0 && (
                      <span>Material: {product.materialWeightUsed}g</span>
                    )}
                    {product.printTimeMinutes > 0 && (
                      <span>Tempo: {formatPrintTime(product.printTimeMinutes)}</span>
                    )}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Material:</span>
                    <span className="text-right font-medium text-foreground">{formatCurrency(product.materialCost)}</span>
                    <span>Mão de obra:</span>
                    <span className="text-right font-medium text-foreground">{formatCurrency(product.laborCost)}</span>
                    <span>Energia:</span>
                    <span className="text-right font-medium text-foreground">{formatCurrency(product.energyCost)}</span>
                    <span>Outros:</span>
                    <span className="text-right font-medium text-foreground">{formatCurrency(product.otherCost)}</span>
                  </div>

                  {/* Totals + Margin */}
                  <div className="mt-auto flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Custo total</p>
                      <p className="text-sm font-bold">{formatCurrency(product.totalCost)}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs text-muted-foreground">Preço de venda</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(product.salePrice)}
                      </p>
                    </div>
                    <Badge variant={getMarginVariant(prodMargin)}>
                      {prodMargin.toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${getStockDotColor(product.stock)}`} />
                    <span className="text-sm">
                      Estoque: <span className="font-semibold">{product.stock}</span>
                    </span>
                  </div>
                </CardContent>

                {/* Actions Footer */}
                <CardFooter className="gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteConfirmId(product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <Link
                    href={`/produtos/${product.id}`}
                    className="inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground ml-auto"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                  {deleteConfirmId === product.id && (
                    <div className="ml-1 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Excluir?</span>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => handleDelete(product.id)}
                      >
                        Sim
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Não
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Nome</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const prodMargin = getMargin(product.salePrice, product.totalCost);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.photo ? (
                        <img
                          src={product.photo}
                          alt={product.name}
                          className="size-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.name}
                        {product.sku && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {product.sku}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.materialType ? (
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">{product.materialType}</Badge>
                          {product.materialBrand && (
                            <Badge variant="outline" className="text-xs">{product.materialBrand}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.materialWeightUsed > 0 ? `${product.materialWeightUsed}g` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${getStockDotColor(product.stock)}`} />
                        {product.stock}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getMarginVariant(prodMargin)}>
                        {prodMargin.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                        <Link
                          href={`/produtos/${product.id}`}
                          className="inline-flex size-6 items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="size-3" />
                        </Link>
                        {deleteConfirmId === product.id && (
                          <div className="ml-1 flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="xs"
                              onClick={() => handleDelete(product.id)}
                            >
                              Sim
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Não
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} produtos)
          </p>
          <div className="flex items-center gap-2">
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Informações Básicas */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h4>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Código SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>
            </div>

            {/* Foto do Produto */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Foto do Produto
              </h4>
              <div className="flex items-start gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 w-24 shrink-0 flex-col gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.photo ? (
                    <img
                      src={formData.photo}
                      alt="Preview"
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    <>
                      <ImagePlus className="size-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Adicionar</span>
                    </>
                  )}
                </Button>
                {formData.photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => updateField("photo", "")}
                  >
                    Remover foto
                  </Button>
                )}
              </div>
            </div>

            {/* Material Utilizado */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Material Utilizado
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tipo de Material</Label>
                  <Select
                    value={formData.materialType || undefined}
                    onValueChange={(v) => updateField("materialType", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialBrand">Marca</Label>
                  <Input
                    id="materialBrand"
                    value={formData.materialBrand}
                    onChange={(e) => updateField("materialBrand", e.target.value)}
                    placeholder="Ex: Voolt, Bambu Lab"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialColor">Cor</Label>
                  <Input
                    id="materialColor"
                    value={formData.materialColor}
                    onChange={(e) => updateField("materialColor", e.target.value)}
                    placeholder="Ex: Preto, Branco"
                  />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <Label htmlFor="materialWeightUsed">Peso utilizado por peça (g)</Label>
                <Input
                  id="materialWeightUsed"
                  type="text"
                  inputMode="decimal"
                  min="0"
                  value={formData.materialWeightUsed || ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace(",", ".")) || 0;
                    updateField("materialWeightUsed", v);
                  }}
                  placeholder="Ex: 105"
                />
              </div>
              {formData.materialType && formData.materialWeightUsed > 0 && (
                <div className="rounded-lg border bg-teal-50 dark:bg-teal-950/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Custo do material ({formData.materialType})
                    </span>
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(formData.materialCost)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.materialWeightUsed}g × {
                      materials.find((m) => m.type === formData.materialType)?.costPerGram
                        ? formatCurrency(materials.find((m) => m.type === formData.materialType)!.costPerGram) + "/g"
                        : "sem estoque"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Produção */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Produção
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="weightPerPiece">Peso da peça (g)</Label>
                  <Input
                    id="weightPerPiece"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weightPerPiece}
                    onChange={(e) => updateField("weightPerPiece", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printTimeMinutes">Tempo de impressão (min)</Label>
                  <Input
                    id="printTimeMinutes"
                    type="number"
                    min="0"
                    value={formData.printTimeMinutes}
                    onChange={(e) => updateField("printTimeMinutes", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Custos */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Custos
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Material (R$)</Label>
                  <Input
                    id="materialCost"
                    type="text"
                    readOnly
                    value={formData.materialCost > 0 ? formatCurrency(formData.materialCost) : "0,00"}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Mão de obra (R$)</Label>
                  <Input
                    id="laborCost"
                    type="text"
                    inputMode="decimal"
                    min="0"
                    value={formData.laborCost || ""}
                    onChange={(e) => updateField("laborCost", parseFloat(e.target.value.replace(",", ".")) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energyCost">Energia (R$)</Label>
                  <Input
                    id="energyCost"
                    type="text"
                    inputMode="decimal"
                    min="0"
                    value={formData.energyCost || ""}
                    onChange={(e) => updateField("energyCost", parseFloat(e.target.value.replace(",", ".")) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCost">Outros (R$)</Label>
                  <Input
                    id="otherCost"
                    type="text"
                    inputMode="decimal"
                    min="0"
                    value={formData.otherCost || ""}
                    onChange={(e) => updateField("otherCost", parseFloat(e.target.value.replace(",", ".")) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-bold">{formatCurrency(computedTotal)}</span>
              </div>
            </div>

            {/* Preço e Estoque */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Preço e Estoque
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                  <Input
                    id="salePrice"
                    type="text"
                    inputMode="decimal"
                    min="0"
                    value={formData.salePrice || ""}
                    onChange={(e) => updateField("salePrice", parseFloat(e.target.value.replace(",", ".")) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={formData.stock || ""}
                    onChange={(e) => updateField("stock", parseInt(e.target.value.replace(",", ".")) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Margin Preview */}
            {formData.salePrice > 0 && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Margem estimada:</span>
                <Badge variant={getMarginVariant(margin)}>
                  {margin.toFixed(1)}%
                </Badge>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
