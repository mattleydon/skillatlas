import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteHeader from "./components/site-header";
import ThemeProvider from "./theme-provider";
import { PUBLIC_SEARCH_RECORDS } from "@/lib/search-catalogue";

// Bundled IBM Plex Sans / IBM Plex Mono: no network fetch during dev or build.
// Pinned Fontsource packages retain the upstream OFL licence and font assets.
const interfaceFont = localFont({
  src: [
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sa-interface",
});
const instrumentationFont = localFont({
  src: [
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sa-instrumentation",
});

const initialThemeScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem("skillatlas-theme");
      const darkMode = savedTheme === "dark" || (savedTheme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("skillatlas-dark", darkMode);
      document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    } catch {
      document.documentElement.classList.remove("skillatlas-dark");
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export const metadata: Metadata = {
  title: "SkillAtlas",
  description: "Global Gaming Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interfaceFont.variable} ${instrumentationFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SiteHeader searchRecords={PUBLIC_SEARCH_RECORDS} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
