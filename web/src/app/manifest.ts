import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bayu: books that breeze through",
    short_name: "Bayu",
    description: "Give and lend English books with readers near you.",
    start_url: "/welcome",
    scope: "/",
    display: "standalone",
    background_color: "#eeeeea",
    theme_color: "#dceef7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
