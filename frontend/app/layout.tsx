import type { Metadata } from "next";
import "./globals.css";
import { StockxpertDataProvider } from "@/lib/api/provider";

export const metadata: Metadata = {
  title: "StockXpert — AI Stock Intelligence",
  description:
    "ML-powered stock recommendation platform for Indian markets (NSE/Nifty 100)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StockxpertDataProvider>{children}</StockxpertDataProvider>
      </body>
    </html>
  );
}
