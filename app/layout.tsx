import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "艾德里安 · AI智能伴侣",
  description: "随时倾听，温暖陪伴",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
