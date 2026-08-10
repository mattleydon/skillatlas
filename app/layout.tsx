import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "./components/site-header";
import ThemeProvider from "./theme-provider";

const initialThemeScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem("skillatlas-theme");
      const darkMode = savedTheme !== "light";
      document.documentElement.classList.toggle("skillatlas-dark", darkMode);
      document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    } catch {
      document.documentElement.classList.add("skillatlas-dark");
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

export const metadata: Metadata = {
  title: "SkillAtlas",
  description: "Map your skill. Know your edge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
