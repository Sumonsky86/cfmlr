export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqList {
    id: string;
    faqs: FaqItem[];
}

export const faqLists: Record<string, FaqList> = {
    main: {
        id: 'main',
        faqs: [
            {
                question: "¿Dónde está ubicado CeFEM?",
                answer: "Nos encontramos en Boulevard Kemmis 843, Las Rosas, Santa Fe, a pocos metros del centro de la ciudad."
            },
            {
                question: "¿Cómo puedo sacar un turno?",
                answer: "Podés solicitar tu turno fácilmente por WhatsApp haciendo clic en los botones de la web o comunicándote al número oficial del centro."
            },
            {
                question: "¿Qué especialidades médicas ofrecen?",
                answer: "Contamos con pediatría, traumatología, ginecología, obstetricia, urología, nutrición y servicio de ecografías generales, obstétricas y urológicas."
            },
            {
                question: "¿Realizan ecografías doppler en embarazos?",
                answer: "Sí, realizamos ecografías doppler obstétricas para el control del bebé y estudios específicos de embarazo."
            },
            {
                question: "¿Atienden con obras sociales?",
                answer: "Sí, trabajamos con diversas obras sociales y prepagas. Te recomendamos consultarnos por WhatsApp para confirmar tu cobertura."
            },
            {
                question: "¿Cuál es el horario de atención?",
                answer: "Atendemos de lunes a viernes de 8 a 12 hs y de 16 a 20 hs, siempre con turnos programados para evitar esperas."
            }
        ]
    }
};
