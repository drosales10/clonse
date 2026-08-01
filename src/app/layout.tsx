import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nexo. | Tu red social",
  description: "El gemelo digital de tu red social.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
