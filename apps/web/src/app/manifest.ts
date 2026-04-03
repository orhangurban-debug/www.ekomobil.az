import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EkoMobil",
    short_name: "EkoMobil",
    description: "Azərbaycanda VIN yoxlamalı, şəffaf avtomobil alqı-satqı platforması.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0891B2",
    lang: "az"
  };
}
