import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EkoMobil",
    short_name: "EkoMobil",
    description: "Azərbaycanda VIN yoxlamalı, şəffaf avtomobil alqı-satqı platforması.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#0057FF",
    lang: "az"
  };
}
