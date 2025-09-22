import { siteConfig } from "@data/config";

const videoId = "M4_HOnatb5c";
const pageUrl = new URL("/blog/controles-pediatricos/", siteConfig.siteUrl).toString();

export const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Controles pediátricos y prevención con el Dr. Gustavo Blanco",
  description: "El Dr. Gustavo Blanco comparte controles del niño sano, vacunas y prevención de bronquiolitis en Cefem Las Rosas.",
  thumbnailUrl: [`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`],
  uploadDate: "2023-05-20",
  contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  publisher: {
    "@type": "Organization",
    name: "Cefem – Centro Familiar de Especialidades Médicas",
    url: siteConfig.siteUrl,
  },
  potentialAction: {
    "@type": "WatchAction",
    target: pageUrl,
  },
};
