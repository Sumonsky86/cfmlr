

export interface MenuItem {
  name: string;
  link: string;
}

export const headerMenu: MenuItem[] = [
  { name: 'Inicio', link: '/' },
  { name: 'Especialidades', link: '/especialidades' },
  { name: 'Entrevistas Médicas', link: '/entrevistas-medicas/' },
  { name: 'Blog', link: '/blog' },
];

export const footerMenu: MenuItem[] = [
  { name: 'Ecografías abdominales', link: '/ecografias-abdominales-las-rosas/' },
  { name: 'Ecografías Doppler en embarazo', link: '/ecografias-doppler-embarazo-las-rosas/' },
  { name: 'Ecografías de partes blandas', link: '/ecografias-partes-blandas-lesiones-deportivas/' },
  { name: 'Cirugía vascular y várices', link: '/cirugia-vascular-varices-las-rosas/' },
  { name: 'Ginecología y Obstetricia', link: '/ginecologia-obstetricia/' },
  { name: 'Pediatría', link: '/pediatria/' },
  { name: 'Traumatología', link: '/traumatologia/' },
  { name: 'Nutrición', link: '/nutricion/' },
  { name: 'Entrevistas Médicas', link: '/entrevistas-medicas/' },
];

export const legalMenu: MenuItem[] = [
  { name: 'Política de Privacidad', link: '/legal/privacy-policy' },
  { name: 'Términos y Condiciones', link: '/legal/terms-of-service' },
];
