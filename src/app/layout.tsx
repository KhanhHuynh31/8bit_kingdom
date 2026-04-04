import type { Metadata } from "next";
import "./globals.css";
import { MedievalSharp } from "next/font/google";

export const metadata: Metadata = {
  title: "8bit Kingdom — Thế giới trái cây",
  description: "Cộng đồng thế giới trái cây 8bit Kingdom",
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
