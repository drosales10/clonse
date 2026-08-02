import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Sans, Sora } from "next/font/google";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "nexo. | Tu red social",
  description: "El gemelo digital de tu red social.",
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("nexo-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${sora.variable} ${ibmPlex.variable}`} lang="es" suppressHydrationWarning>
      <body>
        <Script id="nexo-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
