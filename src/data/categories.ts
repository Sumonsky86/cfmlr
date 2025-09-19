interface Category {
  name: string;
  slug: string;
  description: string;
}

export const categories: Category[] = [
  {
    name: 'Ginecología',
    slug: 'ginecologia',
    description: 'Artículos sobre salud femenina y ginecología.'
  },
  {
    name: 'Salud Preventiva',
    slug: 'salud-preventiva',
    description: 'Consejos y guías para la prevención de enfermedades.'
  },
  {
    name: 'Institucional',
    slug: 'institucional',
    description: 'Información sobre nuestra clínica y equipo.'
  },
  {
    name: 'Especialidades',
    slug: 'especialidades',
    description: 'Conoce más sobre nuestras áreas de especialización.'
  },
  {
    name: 'Nutrición',
    slug: 'nutricion',
    description: 'Artículos sobre alimentación y hábitos saludables.'
  },
  {
    name: 'Guías',
    slug: 'guias',
    description: 'Guías prácticas para nuestros pacientes.'
  },
  {
    name: 'Medicina General',
    slug: 'medicina-general',
    description: 'Temas de salud general para toda la familia.'
  },
  {
    name: 'Pediatría',
    slug: 'pediatria',
    description: 'Artículos sobre salud infantil y pediatría.'
  },
  {
    name: 'Urología',
    slug: 'urologia',
    description: 'Artículos sobre salud urológica.'
  },
];

  
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(category => category.slug === slug);
}
