export interface Stat {
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
}

export interface StatsList {
    id: string;
    stats: Stat[];
    content?: {
        title: string;
        description: string;
        button?: {
            text: string;
            link: string;
            variant?: 'primary' | 'secondary' | 'ghostLight' | 'ghostDark';
        };
    };
}

export const statsLists: Record<string, StatsList> = {
    main: {
        id: 'main',
        stats: [
            {
                value: 15,
                label: 'Años de Experiencia',
                prefix: '+',
            },
            {
                value: 7,
                label: 'Especialistas',
            },
            {
                value: 5000,
                label: 'Pacientes Atendidos',
                prefix: '+',
            },
            {
                value: 98,
                label: 'Satisfacción',
                suffix: '%'
            }
        ]
    }
};