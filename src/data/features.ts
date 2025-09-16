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
                title: 'Ecografías',
                description: 'Equipamiento de última generación para ecografías generales, obstétricas, doppler y urológicas. Diagnósticos precisos y seguros.',
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
                title: 'Pediatría',
                description: 'Cuidado integral de la salud de los más pequeños, desde el nacimiento hasta la adolescencia. Controles y seguimiento.',
                isMain: true,
            },
            {
                icon: Droplets,
                title: 'Urología',
                description: 'Diagnóstico y tratamiento de enfermedades del sistema urinario y del aparato reproductor masculino. Cuidado especializado.',
                isMain: true,
            },
            {
                icon: Heart,
                title: 'Ginecología y Obstetricia',
                description: 'Acompañamiento en todas las etapas de la vida de la mujer, controles anuales, seguimiento de embarazo y planificación familiar.',
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
                title: 'Clínica Médica',
                description: 'Atención primaria, diagnóstico y tratamiento de patologías comunes en adultos. Tu médico de cabecera de confianza.',
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