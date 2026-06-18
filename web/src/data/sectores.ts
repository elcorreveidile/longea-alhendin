export interface Sector {
  slug: string;
  name: string; // nombre completo (titular)
  short: string; // nombre corto (chips, listados)
  emoji: string;
  tagline: string; // subtítulo del hero
  intro: string; // párrafo de entrada
  retos: string[]; // retos de los turnos en el sector
  soluciones: string[]; // cómo lo resuelve PlanTurnos
  reglaEjemplo: string; // ejemplo de reglas configurables
  metaDescription: string;
}

export const SECTORES: Sector[] = [
  {
    slug: "residencias",
    name: "Residencias y centros de mayores",
    short: "Residencias",
    emoji: "🏥",
    tagline: "Cuadrantes que cumplen el convenio del sector sociosanitario, en segundos.",
    intro:
      "En una residencia el cuadrante no admite fallos: hay que cubrir cada turno las 24 horas, respetar los ratios de personal y cuidar los descansos del equipo. PlanTurnos lo cuadra automáticamente para que la coordinación deje de ser una pesadilla mensual.",
    retos: [
      "Cobertura continua mañana, tarde y noche, todos los días del año.",
      "Ratios de gerocultoras y auxiliares por número de residentes.",
      "Descanso de 36 h semanales y máximo de días seguidos por convenio.",
      "Reparto justo de noches, fines de semana y festivos.",
    ],
    soluciones: [
      "Genera el mes respetando coberturas y descansos sin que tengas que cuadrar a mano.",
      "Equilibra las noches y los findes entre todo el equipo de forma transparente.",
      "Gestiona vacaciones, bajas y preferencias (quién no hace noches, etc.).",
      "Cada persona ve su turno en el móvil: se acaban las llamadas y los papeles.",
    ],
    reglaEjemplo: "9 de mañana · 9 de tarde · 2 de noche · máx. 4 días seguidos · 2 descansos juntos tras una racha.",
    metaDescription:
      "Software de cuadrantes para residencias y centros de mayores. Genera los turnos cumpliendo ratios y descansos del convenio sociosanitario. Pruébalo gratis.",
  },
  {
    slug: "clinicas",
    name: "Clínicas y centros sanitarios",
    short: "Clínicas",
    emoji: "🩺",
    tagline: "Turnos y guardias bajo control, cumpliendo los descansos del personal sanitario.",
    intro:
      "Consultas, urgencias, guardias y personal a tiempo parcial: organizar los turnos de una clínica es un rompecabezas. PlanTurnos lo resuelve respetando los descansos entre jornadas y la cobertura que necesitas en cada momento.",
    retos: [
      "Cobertura por especialidades y franjas con demanda muy distinta.",
      "Guardias y descansos obligatorios entre jornadas.",
      "Personal a tiempo parcial y con disponibilidad limitada.",
      "Urgencias que no pueden quedarse sin equipo.",
    ],
    soluciones: [
      "Cuadra consultas y guardias respetando las 12 h de descanso entre turnos.",
      "Tiene en cuenta la disponibilidad y el tipo de contrato de cada persona.",
      "Avisa al instante de cualquier hueco de cobertura antes de publicar.",
      "Portal móvil para que cada profesional consulte su agenda.",
    ],
    reglaEjemplo: "Cobertura por turno configurable · 12 h mínimas entre jornadas · descanso tras guardia · sin noches para quien lo necesite.",
    metaDescription:
      "Gestor de turnos y guardias para clínicas y centros sanitarios. Cumple descansos entre jornadas y cobertura por especialidad. Prueba gratuita.",
  },
  {
    slug: "hosteleria",
    name: "Hostelería y restauración",
    short: "Hostelería",
    emoji: "🍽️",
    tagline: "Cuadra los picos de fin de semana y los turnos partidos sin volverte loco.",
    intro:
      "En hostelería la demanda manda: fines de semana, festivos, temporada alta y turnos partidos. PlanTurnos reparte al equipo donde y cuando hace falta, respetando descansos y sin pelearte con el Excel cada semana.",
    retos: [
      "Picos de trabajo en findes, festivos y temporada alta.",
      "Turnos partidos y jornadas que cambian según la ocupación.",
      "Alta rotación de personal y extras puntuales.",
      "Descansos semanales que hay que respetar igualmente.",
    ],
    soluciones: [
      "Refuerza automáticamente los días de más trabajo y aligera los flojos.",
      "Gestiona turnos partidos y franjas a tu medida.",
      "Da de alta y de baja a personal en segundos, sin tocar código.",
      "Reparte findes y festivos con justicia para evitar quejas.",
    ],
    reglaEjemplo: "Más personal viernes y sábado · turnos partidos · 1 día y medio de descanso semanal · reparto equitativo de festivos.",
    metaDescription:
      "Software de cuadrantes para hostelería y restauración. Cubre los picos de fin de semana, turnos partidos y festivos sin esfuerzo. Pruébalo gratis.",
  },
  {
    slug: "seguridad",
    name: "Seguridad y vigilancia",
    short: "Seguridad",
    emoji: "🛡️",
    tagline: "Cobertura 24/7 sin huecos, con relevos perfectos y descansos respetados.",
    intro:
      "Un servicio de seguridad no puede quedarse descubierto ni un minuto. PlanTurnos garantiza la cobertura continua, organiza los relevos de los turnos de 12 horas y reparte las noches con equidad entre el equipo.",
    retos: [
      "Cobertura ininterrumpida las 24 horas, los 365 días.",
      "Turnos largos (12 h) y relevos que no pueden fallar.",
      "Servicios repartidos en varios puntos o clientes.",
      "Descanso obligatorio entre servicios y rotación de noches.",
    ],
    soluciones: [
      "Asegura que cada franja y cada puesto está siempre cubierto.",
      "Encadena los relevos sin solapes ni huecos.",
      "Reparte las noches y los festivos de forma justa.",
      "Cada vigilante consulta su cuadro de servicio desde el móvil.",
    ],
    reglaEjemplo: "Cobertura 24/7 por puesto · turnos de 12 h · descanso mínimo entre servicios · rotación equilibrada de noches.",
    metaDescription:
      "Gestor de cuadrantes para empresas de seguridad y vigilancia. Cobertura 24/7, relevos sin huecos y reparto justo de noches. Prueba gratuita.",
  },
  {
    slug: "limpieza",
    name: "Limpieza y servicios",
    short: "Limpieza",
    emoji: "🧹",
    tagline: "Organiza equipos en varios centros y horarios partidos sin líos.",
    intro:
      "Madrugadas, turnos partidos y personal que rota entre distintos centros y clientes. PlanTurnos pone orden en la planificación de limpieza para que nadie se quede sin cubrir y cada persona sepa dónde y cuándo trabaja.",
    retos: [
      "Personal que rota entre varios centros o clientes.",
      "Horarios muy tempranos, nocturnos o partidos.",
      "Coberturas distintas según el contrato de cada servicio.",
      "Sustituciones rápidas cuando alguien falta.",
    ],
    soluciones: [
      "Asigna equipos a cada centro respetando las horas de cada servicio.",
      "Gestiona turnos partidos y franjas poco habituales sin problema.",
      "Reorganiza al instante cuando hay una baja o un cambio.",
      "Cada trabajador ve su centro y su horario en el móvil.",
    ],
    reglaEjemplo: "Equipos por centro · franjas y turnos partidos · descanso semanal · sustituciones ágiles.",
    metaDescription:
      "Software de turnos para empresas de limpieza y servicios. Coordina equipos en varios centros, turnos partidos y sustituciones. Pruébalo gratis.",
  },
  {
    slug: "industria",
    name: "Industria y producción",
    short: "Industria",
    emoji: "🏭",
    tagline: "Turnos rotativos a 3 relevos con producción continua y sin parones.",
    intro:
      "La línea no para, y los relevos tampoco pueden fallar. PlanTurnos organiza los turnos rotativos de producción (mañana, tarde y noche) manteniendo la cobertura de cada puesto y un reparto justo de la carga.",
    retos: [
      "Producción continua 24/7 con turnos rotativos a 3 o 4 relevos.",
      "Cobertura por línea y por puesto que no puede quedar coja.",
      "Rotación equilibrada para que nadie cargue siempre con las noches.",
      "Descansos y máximos de jornada según convenio industrial.",
    ],
    soluciones: [
      "Genera la rotación de turnos manteniendo cada puesto cubierto.",
      "Equilibra mañanas, tardes y noches entre todo el equipo.",
      "Respeta descansos y máximos de días seguidos automáticamente.",
      "Cada operario consulta su turno y su línea desde el móvil.",
    ],
    reglaEjemplo: "Rotación M/T/N a 3 relevos · cobertura por puesto · máx. días seguidos · descanso entre ciclos.",
    metaDescription:
      "Gestor de turnos rotativos para industria y producción 24/7. Mantén la cobertura por puesto y un reparto justo de los relevos. Prueba gratuita.",
  },
  {
    slug: "academias",
    name: "Academias y centros de formación",
    short: "Academia",
    emoji: "🎓",
    tagline: "Cuadra clases, profesores y disponibilidad sin solapes.",
    intro:
      "Horarios de clases, profesores a tiempo parcial y disponibilidad por asignatura: planificar una academia tiene mucho de cuadrante. PlanTurnos te ayuda a asignar a cada docente a sus franjas sin choques y a cubrir sustituciones al momento.",
    retos: [
      "Horarios de clases que encajar con la disponibilidad de cada docente.",
      "Profesores a tiempo parcial y por asignatura.",
      "Refuerzos y sustituciones de última hora.",
      "Evitar solapes y huecos en el calendario.",
    ],
    soluciones: [
      "Asigna a cada profesor a sus franjas respetando su disponibilidad.",
      "Detecta solapes y huecos antes de publicar el horario.",
      "Reorganiza al instante ante una baja o un cambio.",
      "Cada docente consulta su horario actualizado desde el móvil.",
    ],
    reglaEjemplo: "Disponibilidad por docente · franjas de clase · sin solapes · sustituciones rápidas.",
    metaDescription:
      "Software para organizar horarios de academias y centros de formación. Asigna profesores por disponibilidad y cubre sustituciones sin solapes.",
  },
];

export function getSector(slug: string): Sector | undefined {
  return SECTORES.find((s) => s.slug === slug);
}
