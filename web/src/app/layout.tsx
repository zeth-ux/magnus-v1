import type { Metadata, Viewport } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { SITE_URL } from "@/lib/site/url";

export const metadata: Metadata = {
  // Absolute addresses for the share card, canonical links and the sitemap.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bayu: books that breeze through",
    template: "%s · Bayu",
  },
  description:
    "Give and lend English books with readers near you in Ansan. Credits keep every swap fair.",
  applicationName: "Bayu",
  openGraph: {
    type: "website",
    siteName: "Bayu",
    title: "Bayu: books that breeze through",
    description: "Give and lend English books with readers near you in Ansan. Credits keep every swap fair.",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Bayu", statusBarStyle: "black" },
};

// Every page is on the dark "malam" ground now.
export const viewport: Viewport = {
  themeColor: "#1c1614",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-svh">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
