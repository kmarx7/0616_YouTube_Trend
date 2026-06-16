import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TubePulse | 프리미엄 유튜브 대시보드 및 트렌드 분석기",
  description: "유튜브 채널 퍼포먼스 분석, 키워드 트렌드 추적, 경쟁사 벤치마킹, 댓글 감성 분석을 제공하는 프리미엄 대시보드 솔루션 TubePulse입니다.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa]">
        {children}
      </body>
    </html>
  );
}
