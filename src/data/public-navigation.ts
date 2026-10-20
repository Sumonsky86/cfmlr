import { PUBLIC_PATHS } from '../utils/public-routes';

/** One public menu; the legacy menu used by the protected shell is independent. */
export const publicNavigation = [
  { href: '/especialidades/', label: 'Especialidades' },
  { href: '/entrevistas-medicas/', label: 'Entrevistas médicas' },
  { href: '/blog/', label: 'Blog' },
  { href: PUBLIC_PATHS.contact, label: 'Contacto' },
] as const;
