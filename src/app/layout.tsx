import type { Metadata } from "next";
import "./globals.css";
import { MedievalSharp } from "next/font/google";

export const metadata: Metadata = {
  title: "Kingdom 8bit — Thế giới bơ",
  description: "Cộng đồng Thế giới bơ Kingdom 8bit",
};
const fantasyBody = MedievalSharp({ weight: "400", subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${fantasyBody.className} overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
