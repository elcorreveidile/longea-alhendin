/** Catálogo real de asignaturas del CLM (Acentos), tomado del folleto y la web.
 *  Para carga masiva en /panel/docencia/asignaturas. Idiomas: "es" | "en" | "es,en".
 *  El nivel/dotación se afina luego por asignatura; aquí van como "abierta". */
export interface SubjectSeed {
  name: string;
  area: string;
  languages: string;
}

export const ACENTOS_SUBJECTS: SubjectSeed[] = [
  // A. Lengua
  { name: "Producción Oral y Escrita", area: "Lengua", languages: "es" },
  { name: "Nociones de Gramática Española", area: "Lengua", languages: "es" },
  { name: "La Diversidad del Español en el Mundo", area: "Lengua", languages: "es" },
  { name: "Introducción al Español de los Negocios", area: "Lengua", languages: "es" },
  { name: "Lengua de Signos Española", area: "Lengua", languages: "es" },
  { name: "Introducción a la Lengua Árabe", area: "Lengua", languages: "es" },
  { name: "Prácticas Comunicativas", area: "Lengua", languages: "es" },
  { name: "Traducción Inglés-Español", area: "Lengua", languages: "es" },
  // B. Literatura
  { name: "Literatura Española (hasta s. XVIII)", area: "Literatura", languages: "es" },
  { name: "Literatura Española del Siglo XIX a la Actualidad", area: "Literatura", languages: "es" },
  { name: "Literatura Española", area: "Literatura", languages: "en" },
  { name: "Escritoras en Español del Siglo XX", area: "Literatura", languages: "es" },
  { name: "Literatura Hispanoamericana", area: "Literatura", languages: "es" },
  // C. Geografía
  { name: "Cambios Sociales y Demográficos en la Geografía Española", area: "Geografía", languages: "es,en" },
  { name: "Sostenibilidad en el Mediterráneo", area: "Geografía", languages: "en" },
  { name: "Geografía de España", area: "Geografía", languages: "es" },
  // D. Historia
  { name: "Historia de España", area: "Historia", languages: "es,en" },
  // E. Historia del Arte
  { name: "Historia del Arte en España", area: "Historia del Arte", languages: "es,en" },
  { name: "Música Andalusí: Historia, Poesía y Legado Cultural", area: "Historia del Arte", languages: "en" },
  // F. Cultura
  { name: "Civilización y Cultura Españolas", area: "Cultura", languages: "es,en" },
  { name: "Civilización y Cultura Hispanoamericanas", area: "Cultura", languages: "es,en" },
  { name: "Cultura Islámica en España", area: "Cultura", languages: "es,en" },
  { name: "Canción Tradicional y Sociedad Española: Flamenco, Folclor y Canción Sefardí", area: "Cultura", languages: "es" },
  { name: "La España Actual en los Medios de Comunicación", area: "Cultura", languages: "es" },
  // G. Sociología, Política y Economía
  { name: "El Mundo Árabe y Occidente: Pasado y Futuro", area: "Sociología, Política y Economía", languages: "en" },
  { name: "Economía Española y Latinoamericana", area: "Sociología, Política y Economía", languages: "es,en" },
  { name: "Sistema Político en España y en la Unión Europea", area: "Sociología, Política y Economía", languages: "es,en" },
  { name: "Política Ambiental de la Unión Europea", area: "Sociología, Política y Economía", languages: "en" },
  { name: "Marketing Internacional", area: "Sociología, Política y Economía", languages: "es,en" },
  { name: "Gestión Estratégica Internacional", area: "Sociología, Política y Economía", languages: "en" },
  { name: "Comunicación Intercultural", area: "Sociología, Política y Economía", languages: "en" },
  // H. Ciencia y Tecnología
  { name: "Ciencias de la Salud y Salud Pública en España", area: "Ciencia y Tecnología", languages: "es,en" },
  { name: "Introducción al Cuidado de la Salud", area: "Ciencia y Tecnología", languages: "es" },
  { name: "Ingeniería Civil y Territorio", area: "Ciencia y Tecnología", languages: "en" },
  { name: "Matemáticas y Realidad", area: "Ciencia y Tecnología", languages: "en" },
  { name: "Introducción a la Psicología Cognitiva Aplicada", area: "Ciencia y Tecnología", languages: "es,en" },
  { name: "Energías Renovables", area: "Ciencia y Tecnología", languages: "es" },
  { name: "Ecología y Medioambiente en España", area: "Ciencia y Tecnología", languages: "en" },
  // Derecho
  { name: "Derecho Español de los Negocios", area: "Derecho", languages: "es" },
  { name: "Sistema Jurídico Español y de la Unión Europea", area: "Derecho", languages: "es" },
  // Prácticas
  { name: "Prácticas de Voluntariado", area: "Prácticas", languages: "es" },
  { name: "Prácticas de Derecho", area: "Prácticas", languages: "es" },
  { name: "Programa de Prácticas de Empresa", area: "Prácticas", languages: "es" },
  { name: "Programa de Prácticas en Centros Sanitarios", area: "Prácticas", languages: "es" },
];
