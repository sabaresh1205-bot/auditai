import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AuditAI — Audit & optimize AI tool spend",
    template: "%s | AuditAI",
  },
  description:
    "AuditAI helps startups find waste in AI tool spend and get actionable, rule-based savings recommendations.",
  metadataBase:
    typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
      ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
      : undefined,
  openGraph: {
    title: "AuditAI — Audit & optimize AI tool spend",
    description:
      "AuditAI gives deterministic recommendations to cut AI tool waste for startups.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditAI — Audit & optimize AI tool spend",
    description:
      "Rule-based audits that find concrete savings in your AI stack.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
