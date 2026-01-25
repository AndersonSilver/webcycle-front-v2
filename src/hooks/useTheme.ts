import { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  backgroundSecondary: string;
  border: string;
  accent: string;
  danger: string;
  success: string;
  info: string;
}

const defaultTheme: ThemeColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#10B981',
  secondaryDark: '#059669',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  border: '#E5E7EB',
  accent: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  info: '#6366F1',
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const themeData = await apiClient.getTheme();
        setTheme({
          primary: themeData.primary,
          primaryDark: themeData.primaryDark,
          primaryLight: themeData.primaryLight,
          secondary: themeData.secondary,
          secondaryDark: themeData.secondaryDark,
          textPrimary: themeData.textPrimary,
          textSecondary: themeData.textSecondary,
          background: themeData.background,
          backgroundSecondary: themeData.backgroundSecondary,
          border: themeData.border,
          accent: themeData.accent,
          danger: themeData.danger,
          success: themeData.success,
          info: themeData.info,
        });
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
        setTheme(defaultTheme);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Aplicar cores como CSS variables no documento
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-secondary-dark', theme.secondaryDark);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-background-secondary', theme.backgroundSecondary);
    root.style.setProperty('--theme-border', theme.border);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-danger', theme.danger);
    root.style.setProperty('--theme-success', theme.success);
    root.style.setProperty('--theme-info', theme.info);
  }, [theme]);

  return { theme, loading, setTheme };
};

