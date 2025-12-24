import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FHEDAO - Encrypted Voting",
  description: "Fully homomorphic encrypted voting on-chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="polyfill-global" strategy="beforeInteractive">
          {`if (typeof global === 'undefined') { window.global = window; }`}
        </Script>
      </head>
      <body>
        <Providers>
          {children}
          <NoiseOverlay />
        </Providers>
      </body>
    </html>
  );
}
