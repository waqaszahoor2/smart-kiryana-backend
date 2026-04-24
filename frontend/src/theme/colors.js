/**
 * Smart Store - Design System Colors
 * ======================================
 * Centralized color palette for the entire app.
 */

import { Appearance } from 'react-native';

const darkTheme = {
    primary: "#0D9488",
    primaryDark: "#0F766E",
    primaryLight: "#14B8A6",
    primarySoft: "#CCFBF1",
    accent: "#F59E0B",
    accentSoft: "#FEF3C7",
    bgDark: "#0F172A",
    bgCard: "#1E293B",
    bgCardLight: "#334155",
    bgSurface: "#F8FAFC",
    bgInput: "#F1F5F9",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textDark: "#0F172A",
    textMuted: "#64748B",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    gradientPrimary: ["#0D9488", "#0F766E"],
    gradientDark: ["#0F172A", "#1E293B"],
    gradientCard: ["#1E293B", "#334155"],
    gradientAccent: ["#F59E0B", "#D97706"],
    gradientHero: ["#0F172A", "#0D9488"],
    white: "#FFFFFF",
    black: "#000000",
    border: "#334155",
    borderLight: "#E2E8F0",
    shadow: "rgba(0, 0, 0, 0.25)",
    overlay: "rgba(15, 23, 42, 0.6)",
};

const lightTheme = {
    primary: "#0D9488",
    primaryDark: "#0F766E",
    primaryLight: "#14B8A6",
    primarySoft: "#E0F2FE",
    accent: "#F59E0B",
    accentSoft: "#FEF3C7",
    bgDark: "#F8FAFC",
    bgCard: "#FFFFFF",
    bgCardLight: "#F1F5F9",
    bgSurface: "#F8FAFC",
    bgInput: "#FFFFFF",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textDark: "#0F172A",
    textMuted: "#64748B",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    gradientPrimary: ["#0D9488", "#0F766E"],
    gradientDark: ["#F8FAFC", "#FFFFFF"],
    gradientCard: ["#FFFFFF", "#F1F5F9"],
    gradientAccent: ["#F59E0B", "#D97706"],
    gradientHero: ["#E0F2FE", "#0D9488"],
    white: "#FFFFFF",
    black: "#000000",
    border: "#E2E8F0",
    borderLight: "#CBD5E1",
    shadow: "rgba(0, 0, 0, 0.1)",
    overlay: "rgba(15, 23, 42, 0.2)",
};

const COLORS = Appearance.getColorScheme() === 'light' ? lightTheme : darkTheme;

export default COLORS;
