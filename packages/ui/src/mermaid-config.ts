export type MermaidThemeMode = "dark" | "light";

export function getDocumentThemeMode(): MermaidThemeMode {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Nexa-aligned Mermaid theme (high contrast in dark mode). */
export function getMermaidInitializeOptions(mode: MermaidThemeMode) {
  const isDark = mode === "dark";

  if (isDark) {
    return {
      startOnLoad: false,
      securityLevel: "loose" as const,
      fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
      theme: "base" as const,
      themeVariables: {
        darkMode: true,
        background: "#171819",
        mainBkg: "#303031",
        secondBkg: "#3a3b3d",
        tertiaryBkg: "#171819",
        primaryColor: "#ffd369",
        primaryTextColor: "#171819",
        primaryBorderColor: "#444444",
        secondaryColor: "#3a3b3d",
        secondaryTextColor: "#fafafa",
        secondaryBorderColor: "#555555",
        tertiaryColor: "#303031",
        tertiaryTextColor: "#fafafa",
        lineColor: "#a1a1aa",
        textColor: "#fafafa",
        nodeBorder: "#555555",
        clusterBkg: "#303031",
        clusterBorder: "#444444",
        titleColor: "#ffd369",
        edgeLabelBackground: "#303031",
      },
    };
  }

  return {
    startOnLoad: false,
    securityLevel: "loose" as const,
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    theme: "base" as const,
    themeVariables: {
      darkMode: false,
      background: "#ffffff",
      mainBkg: "#f4f4f5",
      primaryColor: "#18181b",
      primaryTextColor: "#fafafa",
      lineColor: "#71717a",
      textColor: "#09090b",
      nodeBorder: "#e4e4e7",
    },
  };
}
