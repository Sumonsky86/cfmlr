/** Public URL names are independent from stable content collection IDs. */
export const PUBLIC_PATHS = {
  contact: '/contacto/',
  privacy: '/legal/privacidad/',
  terms: '/legal/terminos-y-condiciones/',
} as const;

export function legalSlug(entrySlug: string): string {
  if (entrySlug === 'privacy-policy') return 'privacidad';
  if (entrySlug === 'terms-of-service') return 'terminos-y-condiciones';
  return entrySlug;
}

export function categoryPath(slug: string): string {
  return `/categorias/${slug}/`;
}

export function paginationPath(baseUrl: string, page: number, canonical = false): string {
  if (!Number.isInteger(page) || page < 1) throw new RangeError('La página debe ser un entero positivo.');
  if (!canonical) return page === 1 ? baseUrl : `${baseUrl}/${page}`;
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}${page === 1 ? '' : `/${page}`}/`;
}

export function legalPath(entrySlug: string): string {
  return `/legal/${legalSlug(entrySlug)}/`;
}
