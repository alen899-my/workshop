import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repairo — Garage Management Software",
    short_name: "Repairo",
    description:
      "India's leading vehicle repair management platform. Job cards, invoicing, inventory, and public workshop finder built for modern garages.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#0d9488",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "utilities"],
    lang: "en-IN",
    icons: [
      {
        src: "/images/logos/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/images/logos/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/images/og/og-home.png",
        sizes: "1200x630",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide",
        label: "Repairo Dashboard",
      },
    ],
  };
}
