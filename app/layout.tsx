import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import FetchAuth from "@/app/components/FetchAuth";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "스카이수학과학입시학원 | 당산권 수학·과학 전문",
  description: "선유고·장훈고·여의도고 등 당산권 학교별 내신 분석과 입시 전략을 제공하는 수학·과학 전문 학원. 학습관리 시스템·월간 리포트·소수 정예 수업.",
  openGraph: {
    title: "스카이수학과학입시학원",
    description: "당산권 학교별 내신 분석 · 학습관리 · 월간 리포트 · 입시 전략",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <FetchAuth />
        {children}
      </body>
    </html>
  );
}
