import { entrevistas } from './interviews.ts';

/** Titles checked against each video's official YouTube oEmbed response.
 * IDs and legacy clinical-page data remain unchanged. Do not infer a topic from
 * a generic publication title or treat an interview as current availability.
 */
const publishedTitles: Record<string, { title: string; sourceTitle: string }> = {
  Ip3cp_Sifuo: { title: '23-01-24 Nota Dr. Gustavo Blanco – Pediatra', sourceTitle: '23-01-24 Nota Dr. Gustavo Blanco – Pediatra' },
  M4_HOnatb5c: { title: '13-10-21 Nota Dr. Gustavo Blanco – Mat. 12775', sourceTitle: '13-10-21 Nota Dr. Gustavo Blanco – Mat. 12775' },
  CXTaYAMYgEQ: { title: '04-05-22 Nota Dr. Gustavo Blanco – Mat. 12775', sourceTitle: '04-05-22 Nota Dr. Gustavo Blanco – Mat. 12775' },
  JaOhVfsBd6A: { title: 'Niños prematuros', sourceTitle: 'GUSTAVO BLANCO  los niños prematuros' },
  VuSxn48YRv4: { title: 'Semana Mundial de la Lactancia Materna', sourceTitle: 'GUSTAVO BLANCO   SEMANA MUNDIAL DE LA LACTANCIA MATERNA' },
  '-vakwjjRW6g': { title: '04-01-23 Nota Gustavo Blanco – Med. Pediatra', sourceTitle: '04-01-23 Nota Gustavo Blanco – Med. Pediatra' },
  Z0CjDqEcKNE: { title: 'Sarampión', sourceTitle: 'GUSTAVO BLANCO  sarampion' },
  eruZqiTysJA: { title: 'Prevención del cáncer de mama', sourceTitle: 'DR  ALFONSO ALAMO  prevencion de cancer de mama' },
  qz4ytAzTPAg: { title: 'Cirugías endovasculares y tradicionales', sourceTitle: 'DR  ALAMO  cirugias endovasculares y tradicionales' },
  ssJ_NY_H5Io: { title: 'Enfermedades cardiovasculares · 1.ª parte', sourceTitle: 'Dr  ALAMO  avance en enf  cardiovasculares 1º parte' },
  zirkVTzkrM4: { title: 'Cirugías endovasculares y tradicionales', sourceTitle: 'DR  ALAMO  cirugias endovasculares y tradicionales' },
  '39Wd_DulN4M': { title: 'La artrosis', sourceTitle: 'PABLO GONZALEZ - LA ARTROSIS' },
  YemQ4dCJDvw: { title: 'Entrevista con el Dr. Pablo González', sourceTitle: 'DR  PABLO GONZALEZ – MEDICO TRAUMATOLOGO' },
  KtYDxy8dYP8: { title: 'Dolores 2.0', sourceTitle: 'PABLO GONZALEZ  - Dolores 2.0' },
};

export const publicInterviewGroups = [
  { id: 'pediatria', label: 'Pediatría', doctor: 'Dr. Gustavo Blanco', items: entrevistas.pediatria },
  { id: 'gineco', label: 'Ginecología y Obstetricia', doctor: 'Dr. Alfonso Alamo', items: entrevistas.gineco },
  { id: 'vascular', label: 'Cirugía Vascular Periférica', doctor: 'Dr. Alejandro Alamo', items: entrevistas.vascular },
  { id: 'trauma', label: 'Traumatología y Lesiones Deportivas', doctor: 'Dr. Pablo González', items: entrevistas.trauma },
].map(group => ({
  ...group,
  items: group.items.map(({ id }) => {
    const metadata = publishedTitles[id];
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !metadata) throw new Error(`Falta verificar la entrevista: ${id}`);
    return { id, ...metadata, url: `https://www.youtube.com/watch?v=${id}` };
  }),
}));
