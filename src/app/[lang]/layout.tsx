import "@/app/global.css";
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { RootProvider } from "fumadocs-ui/provider/next";
import { NextProvider } from 'fumadocs-core/framework/next';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { i18n } from '@/lib/i18n';

const inter = Inter({
  subsets: ["latin"],
});

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    cn: {
      displayName: 'Chinese',
      search: '搜索文档',
    },
  },
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://ideasearch.cn",
  ),
  title: "IdeaSearch",
  description: "IdeaSearch 文档",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const lang = (await params).lang;
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="256x256" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          i18n={provider(lang)}
        >
          <NextProvider>{children}</NextProvider>
        </RootProvider>
      </body>
    </html>
  );
}
