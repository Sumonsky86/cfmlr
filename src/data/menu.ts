

export interface MenuItem {
  name: string;
  link: string;
}

export const headerMenu: MenuItem[] = [
  { name: 'Inicio', link: '/' },
  { name: 'Especialidades', link: '/especialidades' },
  { name: 'Blog', link: '/blog' },
];

export const footerMenu: MenuItem[] = [
  { name: 'Ecografías en Las Rosas', link: '/especialidades' },
  { name: 'Pediatría', link: '/especialidades' },
  { name: 'Traumatología', link: '/especialidades' },
  { name: 'Ginecología y Obstetricia', link: '/especialidades' },
  { name: 'Urología', link: '/especialidades' },
  { name: 'Nutrición', link: '/especialidades' },
  { name: 'Depilación', link: '/especialidades' },
  { name: 'Solicitar Turno por WhatsApp', link: 'https://wa.me/5493471341461' },
];

export const legalMenu: MenuItem[] = [
  { name: 'Política de Privacidad', link: '/legal/privacy-policy' },
  { name: 'Términos y Condiciones', link: '/legal/terms-of-service' },
];