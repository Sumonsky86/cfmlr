import { appointmentContact } from './appointments';
import { siteConfig } from './config';

/** User-confirmed identity. Contact values come from the reception source. */
export const institutionalIdentity = {
  name: 'CEFEM Centro Familiar de Especialidades Médicas',
  shortName: 'CEFEM',
  address: {
    '@type': 'PostalAddress',
    streetAddress: appointmentContact.address,
    addressLocality: appointmentContact.city,
    addressRegion: 'Santa Fe',
    addressCountry: 'AR',
  },
} as const;

/** Organization identity, not a promise of Google LocalBusiness rich results. */
export const institutionalSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  '@id': new URL('#organization', siteConfig.siteUrl).href,
  name: institutionalIdentity.name,
  alternateName: institutionalIdentity.shortName,
  url: siteConfig.siteUrl,
  logo: new URL('/cefem.png', siteConfig.siteUrl).href,
  address: institutionalIdentity.address,
  email: appointmentContact.email,
};
