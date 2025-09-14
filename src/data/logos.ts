import type { ImageMetadata } from 'astro';

  
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