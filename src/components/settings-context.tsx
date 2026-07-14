"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SettingsContextType {
  settings: Record<string, string>;
  refreshSettings: () => Promise<void>;
  companyName: string;
  companyTagline: string;
  companyLogo: string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  refreshSettings: async () => {},
  companyName: "Forma Pop",
  companyTagline: "3D",
  companyLogo: "",
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const companyName = settings.companyName || "Forma Pop";
  const companyTagline = settings.companyTagline || "3D";
  const companyLogo = settings.companyLogo || "";

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, companyName, companyTagline, companyLogo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
