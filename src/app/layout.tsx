import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StorySeed — AI 어린이 그림책",
  description:
    "아이만을 위한 맞춤 그림책. 스토리, 삽화, 음성낭독, PDF까지 한 번에.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${dmSans.variable} h-full`}>
      <body className="bg-paper min-h-full antialiased">{children}</body>
    </html>
  );
}
