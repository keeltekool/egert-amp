import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "egert_amp",
  description: "Personal FLAC player powered by Google Drive",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
