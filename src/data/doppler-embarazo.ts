import { siteConfig } from "@data/config";

const videoId = "eruZqiTysJA";
const pageUrl = new URL("/blog/doppler-embarazo-cuando-hacerlo/", siteConfig.siteUrl).toString();

export const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "Doppler obstétrico explicado por el Dr. Alfonso Alamo",
  description: "El Dr. Alfonso Alamo detalla indicaciones, parámetros y cuidados del Doppler obstétrico en Cefem Las Rosas.",
  thumbnailUrl: [`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`],
  uploadDate: "2023-06-12",
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
