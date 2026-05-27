import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hip AI Health | Secure AI Medical Scribe",
  description: "Private-cloud, zero-retention AI medical scribe and HIPAA-compliant SOAP note generator for behavioral health professionals.",
  alternates: {
    canonical: "https://phi-scrubber-13754652105.us-central1.run.app/",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Hip AI Health | Secure AI Medical Scribe",
    description: "Private-cloud, zero-retention AI medical scribe and HIPAA-compliant SOAP note generator for behavioral health professionals.",
    type: "website",
    url: "https://phi-scrubber-13754652105.us-central1.run.app/",
    images: [
      {
        url: "https://phi-scrubber-13754652105.us-central1.run.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hip AI Health Secure AI Medical Scribe",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <div className="fluid-bg-container">
          <div className="fluid-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
