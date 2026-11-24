import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora, Unbounded } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-sora" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const unbounded = Unbounded({ subsets: ["latin"], weight: ["600"], variable: "--font-brand" });

export const metadata: Metadata = {
  title: "Rujuk – tanya jawab dokumen",
  description: "Tanya jawab dokumen dengan rujukan ke kutipan aslinya.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${sora.variable} ${jakarta.variable} ${unbounded.variable}`}>
        {children}
      </body>
    </html>
  );
}
