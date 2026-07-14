"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Upload, Save, Image } from "lucide-react";
import { useSettings } from "@/components/settings-context";

export default function ConfiguracoesPage() {
  const { companyName: defaultName, companyTagline: defaultTagline, companyLogo: defaultLogo, refreshSettings } = useSettings();
  const [companyName, setCompanyName] = useState(defaultName);
  const [companyTagline, setCompanyTagline] = useState(defaultTagline);
  const [companyLogo, setCompanyLogo] = useState(defaultLogo);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCompanyName(defaultName);
    setCompanyTagline(defaultTagline);
    setCompanyLogo(defaultLogo);
  }, [defaultName, defaultTagline, defaultLogo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompanyLogo(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, companyTagline, companyLogo }),
      });
      if (res.ok) {
        await refreshSettings();
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Personalize a aparência do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Forma Pop"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyTagline">Subtítulo / Slogan</Label>
            <Input
              id="companyTagline"
              value={companyTagline}
              onChange={(e) => setCompanyTagline(e.target.value)}
              placeholder="Ex: 3D"
            />
            <p className="text-xs text-muted-foreground">Texto que aparece abaixo do nome na sidebar</p>
          </div>

          <div className="space-y-2">
            <Label>Logomarca</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {companyLogo ? (
              <div className="relative group">
                <img
                  src={companyLogo}
                  alt="Logo da empresa"
                  className="h-32 w-auto rounded-lg border object-contain"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Alterar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para fazer upload da logomarca</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Pré-visualização da Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border bg-background p-4 max-w-xs">
            {companyLogo ? (
              <img src={companyLogo} alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold tracking-tight shadow-sm">
                {companyName.charAt(0) || "F"}
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">{companyName || "Forma Pop"}</span>
              <span className="text-xs text-muted-foreground font-medium">{companyTagline || "3D"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
