import type { ImageMetadata } from 'astro';

  
export interface Logo {
    name: string;
    image: ImageMetadata;
    url?: string;
}

export interface LogoList {
    id: string;
    logos: Logo[];
}
  
export const logoLists: Record<string, LogoList> = {
    main: {
        id: 'main',
        logos: [

        ],
    },
};