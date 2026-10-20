const specialtyPaths = new Set([
  '/nutricion/', '/pediatria/', '/traumatologia/', '/ginecologia/', '/ginecologia-obstetricia/',
  '/ecografias-las-rosas/', '/ecografias-abdominales-las-rosas/', '/ecografias-doppler-embarazo-las-rosas/',
  '/ecografias-partes-blandas-lesiones-deportivas/', '/cirugia-vascular-varices-las-rosas/',
  '/urologia/', '/clinica-medica/', '/depilacion-definitiva/',
]);

/** An ancestor section is a location, never incorrectly the current page. */
export function publicNavCurrent(pathname: string, href: string): 'page' | 'location' | undefined {
  if (pathname === href) return 'page';
  if (href === '/especialidades/' && specialtyPaths.has(pathname)) return 'location';
  if (href === '/blog/' && (pathname.startsWith('/blog/') || pathname.startsWith('/categorias/'))) return 'location';
  return undefined;
}
