import type { Metadata, Viewport } from "next"; // Import thêm Viewport
import "./globals.css";
import { MedievalSharp } from "next/font/google";

// 1. Thêm cấu hình Viewport để cố định tỉ lệ 1:1
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Ngăn người dùng zoom làm vỡ layout 8-bit của bạn
};

export const metadata: Metadata = {
  title: "Kingdom 8bit - Thế giới bơ",
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
      {/* Next.js sẽ tự chèn thẻ meta viewport vào đây dựa trên biến viewport ở trên */}
      <body className={`${fantasyBody.className} overflow-hidden antialiased`}>
        {children}
      </body>
    </html>
  );
}