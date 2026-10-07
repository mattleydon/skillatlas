import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import SiteHeader from "./components/site-header";
import ThemeProvider from "./theme-provider";
import { PUBLIC_SEARCH_RECORDS } from "@/lib/search-catalogue";

// Next self-hosts these assets; visitors do not make Google Fonts requests.
const interfaceFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-sa-interface",
});
const instrumentationFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
