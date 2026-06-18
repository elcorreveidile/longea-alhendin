export interface Post {
  slug: string;
  title: string;
  date: string; // ISO
  dateLabel: string;
  excerpt: string;
  bodyHtml: string;
}

export const POSTS: Post[] = [
  {
    slug: "gestor-cuadrantes-turnos-sin-excel",
    title: "¿Sigues haciendo los cuadrantes en Excel? Hay una forma mejor (y más rápida)",
    date: "2026-06-18",
    dateLabel: "18 de junio de 2026",
    excerpt:
      "Si gestionas un equipo a turnos, conoces la escena: fin de mes y una hoja de Excel imposible. Te contamos cómo dejar de pelearte con ella.",
    bodyHtml: `
      <p>Si gestionas un equipo a turnos, conoces esta escena: <strong>fin de mes, café, y la hoja de Excel gigante</strong> delante. Cuadrar mañanas, tardes y noches. Que nadie haga demasiados días seguidos. Respetar descansos, festivos, vacaciones y las mil excepciones de “este no hace noches” y “esta solo de lunes a viernes”.</p>
      <p>Tardas <strong>medio día o más</strong>. Y aun así, cuando lo cuelgas, <strong>alguien se queja</strong>.</p>
      <h2>El problema no es tuyo, es del método</h2>
      <p>Hacer cuadrantes a mano es un trabajo ingrato e invisible: nadie lo agradece, pero si fallas, lo nota todo el equipo. Te roba horas, es fácil equivocarse y genera roces cuando el reparto no es justo. El Excel no está mal; simplemente <strong>no está hecho para esto</strong>.</p>
      <h2>La solución: pulsa un botón y listo</h2>
      <p>PlanTurnos entiende tus reglas (cuántas personas por turno, descansos, máximos de días seguidos, vacaciones, preferencias…) y <strong>calcula el mejor cuadrante posible</strong> que las cumple. Lo que antes era medio día, ahora es un clic. Y si por números es imposible cubrir un día concreto, no te deja tirado: lo genera igual y te avisa de qué falta.</p>
      <h2>Lo que ganas tú y tu equipo</h2>
      <ul>
        <li><strong>Segundos</strong> en lugar de medio día cuadrando.</li>
        <li>Cumple las reglas <strong>siempre</strong>, sin errores ni repasos.</li>
        <li>Cada persona ve su turno <strong>en el móvil</strong>.</li>
        <li>Reparto justo y transparente: menos quejas.</li>
        <li><strong>Avisos automáticos</strong> al publicar, sin papeles ni llamadas.</li>
      </ul>
      <h2>¿Para qué empresas sirve?</h2>
      <p>Para cualquiera que trabaje a turnos: residencias, clínicas, hostelería, seguridad, limpieza, industria o academias. El problema del cuadrante es el mismo en todas partes; cambian los detalles, no la esencia.</p>
      <h2>Hecho a medida, no “una talla para todos”</h2>
      <p>La mayoría de programas te obligan a adaptar tu negocio al software. PlanTurnos funciona al revés: <strong>se adapta a cómo trabajas tú</strong>. Tus turnos, tus normas, tu plantilla. Por eso encaja desde el primer día.</p>
      <p>Imagina llegar a fin de mes y que el cuadrante ya esté hecho, bien hecho y sin discusiones. Eso es lo que hace PlanTurnos.</p>
    `,
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
