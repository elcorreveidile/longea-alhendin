import {
  Languages, BookOpen, Map, Landmark, Palette, Music, Users,
  FlaskConical, Scale, Briefcase, Stethoscope, HeartHandshake,
  GraduationCap, Building2, Mail, type LucideIcon,
} from "lucide-react";

/** Icono (Lucide) por área de estudio. */
export const AREA_ICON: Record<string, LucideIcon> = {
  "Lengua": Languages,
  "Literatura": BookOpen,
  "Geografía": Map,
  "Historia": Landmark,
  "Historia del Arte": Palette,
  "Cultura": Music,
  "Sociología, Política y Economía": Users,
  "Ciencia y Tecnología": FlaskConical,
  "Derecho": Scale,
  "Prácticas": Briefcase,
};

/** Icono por tipo de prácticas (clave de PRACTICAS). */
export const PRACTICA_ICON: Record<string, LucideIcon> = {
  empresa: Briefcase,
  sanitarias: Stethoscope,
  derecho: Scale,
  voluntariado: HeartHandshake,
};

/** Iconos de cabecera de sección. */
export const SECTION_ICON = { cursos: GraduationCap, sobre: Building2, contacto: Mail } as const;
