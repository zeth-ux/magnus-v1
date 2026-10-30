import type { Metadata, Viewport } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bayu: books that breeze through",
    template: "%s · Bayu",
  },
  description:
    "Give and lend English books with readers near you in Ansan. Credits keep every swap fair.",
  applicationName: "Bayu",
  appleWebApp: { capable: true, title: "Bayu", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#dceef7",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
