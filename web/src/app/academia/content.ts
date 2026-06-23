/** Contenido bilingüe (ES/EN) de la web pública de Acentos del español.
 *  Web aditiva en /academia: no toca el panel ni el acceso del personal.
 *  Los datos marcados con TODO son provisionales y hay que confirmarlos. */

import { ACENTOS_SUBJECTS } from "@/data/acentos-subjects";

export type Lang = "es" | "en";

export const LANGS: Lang[] = ["es", "en"];

export const LANG_COOKIE = "acentos_lang";

/** Orden de presentación de las áreas en la web. */
export const AREA_ORDER = [
  "Lengua",
  "Literatura",
  "Geografía",
  "Historia",
  "Historia del Arte",
  "Cultura",
  "Sociología, Política y Economía",
  "Ciencia y Tecnología",
  "Derecho",
  "Prácticas",
];

/** Asignaturas reales agrupadas por área, en orden. */
export function groupedAreas() {
  return AREA_ORDER.map((area) => ({
    area,
    subjects: ACENTOS_SUBJECTS.filter((s) => s.area === area),
  })).filter((g) => g.subjects.length > 0);
}

/** Traducción de las áreas de estudio (las asignaturas reales viven en
 *  src/data/acentos-subjects.ts y se muestran con su título en español). */
export const AREA_LABEL: Record<string, { es: string; en: string }> = {
  Lengua: { es: "Lengua", en: "Language" },
  Literatura: { es: "Literatura", en: "Literature" },
  Geografía: { es: "Geografía", en: "Geography" },
  Historia: { es: "Historia", en: "History" },
  "Historia del Arte": { es: "Historia del Arte", en: "Art History" },
  Cultura: { es: "Cultura", en: "Culture" },
  "Sociología, Política y Economía": {
    es: "Sociología, Política y Economía",
    en: "Sociology, Politics & Economics",
  },
  "Ciencia y Tecnología": { es: "Ciencia y Tecnología", en: "Science & Technology" },
  Derecho: { es: "Derecho", en: "Law" },
  Prácticas: { es: "Prácticas", en: "Internships" },
};

export function areaLabel(area: string, lang: Lang): string {
  return AREA_LABEL[area]?.[lang] ?? area;
}

/** Idioma de impartición de cada asignatura. */
export function langBadge(languages: string, lang: Lang): string {
  if (languages === "es") return "ES";
  if (languages === "en") return "EN";
  return "ES · EN";
}

/** Programas/ediciones. Nombres ampliados como mejor estimación: confirmar. */
export const PROGRAMS = [
  {
    code: "CLCE",
    es: {
      name: "Lengua y Cultura Españolas",
      tag: "Para aprender español",
      desc: "Cursos de español por niveles (A1–C2) combinados con cultura y vida en España. Pensados para estudiantes internacionales que quieren progresar rápido en un entorno de inmersión.",
    },
    en: {
      name: "Spanish Language & Culture",
      tag: "Learn Spanish",
      desc: "Spanish courses by level (A1–C2) combined with culture and daily life in Spain. Designed for international students who want to make fast progress through immersion.",
    },
  },
  {
    code: "CEH",
    es: {
      name: "Estudios Hispánicos",
      tag: "Currículo académico",
      desc: "Asignaturas de literatura, historia, arte, geografía, ciencia y sociedad —en español y en inglés— convalidables en tu universidad de origen. Un curso de estudios hispánicos completo.",
    },
    en: {
      name: "Hispanic Studies",
      tag: "Academic curriculum",
      desc: "Courses in literature, history, art, geography, science and society —in Spanish and English— transferable to your home university. A full Hispanic Studies program.",
    },
  },
  {
    code: "VERANO",
    es: {
      name: "Cursos de Verano",
      tag: "Intensivos",
      desc: "Programas intensivos de verano que mezclan lengua, cultura y actividades. Ideales para una estancia corta sin renunciar a la inmersión.",
    },
    en: {
      name: "Summer Courses",
      tag: "Intensive",
      desc: "Intensive summer programs blending language, culture and activities. Perfect for a short stay without giving up on immersion.",
    },
  },
] as const;

/** Nombre de archivo de la ilustración spot por programa. */
export const PROGRAM_SLUG: Record<string, string> = {
  CLCE: "lengua-cultura",
  CEH: "estudios-hispanicos",
  VERANO: "verano",
};

export const PRACTICAS = [
  { key: "empresa", es: "Prácticas en empresa", en: "Company internships", descEs: "Experiencia profesional real en empresas españolas.", descEn: "Real professional experience in Spanish companies." },
  { key: "sanitarias", es: "Prácticas en centros sanitarios", en: "Healthcare internships", descEs: "Estancias formativas en el ámbito de la salud.", descEn: "Training placements in the healthcare field." },
  { key: "derecho", es: "Prácticas de Derecho", en: "Law internships", descEs: "Acercamiento al sistema jurídico español.", descEn: "A close look at the Spanish legal system." },
  { key: "voluntariado", es: "Voluntariado", en: "Volunteering", descEs: "Compromiso social y práctica del idioma a la vez.", descEn: "Social engagement and language practice at once." },
] as const;

type Dict = {
  htmlLang: string;
  nav: { inicio: string; cursos: string; areas: string; practicas: string; sobre: string; contacto: string };
  hero: { kicker: string; title: string; subtitle: string; ctaCursos: string; ctaContacto: string };
  highlights: { title: string; text: string }[];
  home: { areasTitle: string; areasText: string; areasCta: string; programsTitle: string };
  areas: { title: string; intro: string; legend: string; subjects: string };
  cursos: { title: string; intro: string; pending: string };
  practicas: { title: string; intro: string };
  sobre: { title: string; p1: string; p2: string; p3: string };
  contacto: { title: string; intro: string; name: string; email: string; message: string; send: string; note: string; staff: string };
  footer: { tagline: string; staff: string; rights: string };
};

export const DICT: Record<Lang, Dict> = {
  es: {
    htmlLang: "es",
    nav: { inicio: "Inicio", cursos: "Cursos", areas: "Áreas de estudio", practicas: "Prácticas", sobre: "La academia", contacto: "Contacto" },
    hero: {
      kicker: "Español y estudios hispánicos en Andalucía",
      title: "Aprende español. Vive su cultura.",
      subtitle:
        "Cursos de lengua y un currículo completo de estudios hispánicos —en español e inglés—, con un sello andalusí y mediterráneo único.",
      ctaCursos: "Ver cursos",
      ctaContacto: "Contactar",
    },
    highlights: [
      { title: "Lengua + cultura", text: "Del nivel A1 al C2, con la cultura española integrada en cada curso." },
      { title: "En español e inglés", text: "Buena parte de las asignaturas se imparten también en inglés." },
      { title: "Prácticas reales", text: "Empresa, centros sanitarios, derecho y voluntariado." },
      { title: "Sello andalusí", text: "Cultura islámica, música andalusí, flamenco y Mediterráneo." },
    ],
    home: {
      areasTitle: "Áreas de estudio",
      areasText: "Más de cuarenta asignaturas organizadas en diez áreas: lengua, literatura, historia, arte, cultura, ciencia y mucho más.",
      areasCta: "Explorar las áreas",
      programsTitle: "Nuestros programas",
    },
    areas: {
      title: "Áreas de estudio",
      intro: "Estas son las asignaturas que ofrecemos, organizadas por área. La etiqueta indica el idioma de impartición.",
      legend: "ES = en español · EN = en inglés · ES · EN = en ambos idiomas",
      subjects: "asignaturas",
    },
    cursos: {
      title: "Cursos y programas",
      intro: "Elige el programa que mejor encaja con tu objetivo: aprender español, cursar estudios hispánicos o una estancia intensiva de verano.",
      pending: "Fechas, precios y plazas de cada edición: pendientes de confirmar.",
    },
    practicas: {
      title: "Prácticas",
      intro: "Completa tu formación con experiencia real durante tu estancia en España.",
    },
    sobre: {
      title: "La academia",
      p1: "Acentos del español es un centro de lengua y cultura españolas para estudiantes internacionales en Andalucía.",
      p2: "Combinamos la enseñanza del idioma con un currículo académico amplio —literatura, historia, arte, geografía, ciencia, derecho y sociedad— que puedes convalidar en tu universidad de origen.",
      p3: "Nuestra seña de identidad es el cruce de culturas del sur peninsular: el legado andalusí, el flamenco, el Mediterráneo y la España actual.",
    },
    contacto: {
      title: "Contacto",
      intro: "¿Tienes dudas o quieres más información sobre nuestros cursos? Escríbenos.",
      name: "Nombre",
      email: "Correo electrónico",
      message: "Mensaje",
      send: "Enviar",
      note: "Datos de contacto (dirección, teléfono, correo): pendientes de confirmar.",
      staff: "¿Eres del profesorado o del equipo? Acceso del personal",
    },
    footer: {
      tagline: "Español y estudios hispánicos en Andalucía.",
      staff: "Acceso del personal",
      rights: "Todos los derechos reservados.",
    },
  },
  en: {
    htmlLang: "en",
    nav: { inicio: "Home", cursos: "Courses", areas: "Fields of study", practicas: "Internships", sobre: "About", contacto: "Contact" },
    hero: {
      kicker: "Spanish & Hispanic Studies in Andalusia",
      title: "Learn Spanish. Live its culture.",
      subtitle:
        "Language courses and a full Hispanic Studies curriculum —in Spanish and English—, with a unique Andalusi and Mediterranean character.",
      ctaCursos: "See courses",
      ctaContacto: "Get in touch",
    },
    highlights: [
      { title: "Language + culture", text: "From A1 to C2, with Spanish culture woven into every course." },
      { title: "Spanish and English", text: "Many of our courses are also taught in English." },
      { title: "Real internships", text: "Companies, healthcare, law and volunteering." },
      { title: "Andalusi character", text: "Islamic culture, Andalusi music, flamenco and the Mediterranean." },
    ],
    home: {
      areasTitle: "Fields of study",
      areasText: "More than forty courses across ten fields: language, literature, history, art, culture, science and much more.",
      areasCta: "Explore the fields",
      programsTitle: "Our programs",
    },
    areas: {
      title: "Fields of study",
      intro: "These are the courses we offer, organised by field. The tag shows the language of instruction.",
      legend: "ES = in Spanish · EN = in English · ES · EN = in both languages",
      subjects: "courses",
    },
    cursos: {
      title: "Courses & programs",
      intro: "Choose the program that best fits your goal: learn Spanish, take Hispanic Studies, or an intensive summer stay.",
      pending: "Dates, prices and places for each term: to be confirmed.",
    },
    practicas: {
      title: "Internships",
      intro: "Round off your studies with real experience during your stay in Spain.",
    },
    sobre: {
      title: "About the academy",
      p1: "Acentos del español is a Spanish language and culture centre for international students in Andalusia.",
      p2: "We combine language teaching with a broad academic curriculum —literature, history, art, geography, science, law and society— that you can transfer to your home university.",
      p3: "Our hallmark is the meeting of cultures of southern Spain: the Andalusi legacy, flamenco, the Mediterranean and contemporary Spain.",
    },
    contacto: {
      title: "Contact",
      intro: "Have questions or want more information about our courses? Write to us.",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send",
      note: "Contact details (address, phone, email): to be confirmed.",
      staff: "Staff or faculty? Personnel login",
    },
    footer: {
      tagline: "Spanish & Hispanic Studies in Andalusia.",
      staff: "Personnel login",
      rights: "All rights reserved.",
    },
  },
};
