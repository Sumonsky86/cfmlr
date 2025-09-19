import { Stethoscope, Users, Heart, Waves, Sparkles, Baby, Bone, Leaf, Droplets } from 'lucide-astro';


type LucideIcon = typeof Stethoscope;

export interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    isMain?: boolean; 
}

export interface FeatureList {
    id: string;
    features: Feature[];
}

export const featureLists: Record<string, FeatureList> = {
    main: {
        id: 'main',
        features: [
            {
                icon: Waves,
                title: 'Ecografías en Las Rosas – Cefem',
                description: 'Ecografías generales, obstétricas, Doppler y urológicas con tecnología avanzada y atención personalizada.',
                isMain: true,
            },
            {
                icon: Bone,
                title: 'Traumatología',
                description: 'Atención de lesiones, fracturas y dolencias del sistema locomotor. Tratamientos para recuperar tu movilidad y bienestar.',
                isMain: true,
            },
            {
                icon: Baby,
                title: 'Pediatría en Las Rosas – Cefem',
                description: 'Atención integral infantil en Cefem, con especialistas que acompañan el desarrollo y salud de tus hijos.',
                isMain: true,
            },
            {
                icon: Droplets,
                title: 'Urología en Las Rosas – Cefem',
                description: 'Diagnóstico y tratamiento urológico profesional para hombres y mujeres en Cefem.',
                isMain: true,
            },
            {
                icon: Heart,
                title: 'Ginecología y Obstetricia – Cefem',
                description: 'Controles y seguimiento de embarazos con especialistas de confianza.',
                isMain: true,
            },
            {
                icon: Leaf,
                title: 'Nutrición',
                description: 'Planes de alimentación personalizados para mejorar hábitos, controlar peso y como soporte en diversas patologías.',
                isMain: false,
            },
            {
                icon: Stethoscope,
                title: 'Clínica Médica – Cefem',
                description: 'Atención primaria y seguimiento de enfermedades comunes para toda la familia.',
                isMain: false,
            },
            {
                icon: Sparkles,
                title: 'Depilación Definitiva',
                description: 'Servicio de depilación con tecnología de vanguardia para resultados duraderos, seguros y efectivos.',
                isMain: false,
            },
        ]
    }
};