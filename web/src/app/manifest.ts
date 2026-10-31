import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bayu: books that breeze through",
    short_name: "Bayu",
    description: "Give and lend English books with readers near you.",
    // Opening the installed app lands on the shelf (signed-out readers are sent to sign in).
    start_url: "/browse",
    scope: "/",
    display: "standalone",
    background_color: "#1c1614",
    theme_color: "#1c1614",
    shortcuts: [
      { name: "Add a book", url: "/add" },
      { name: "Activity", url: "/activity" },
    ],
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
