import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "./components/site-header";
import ThemeProvider from "./theme-provider";

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
      <body>
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
