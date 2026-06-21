export interface Post {
  slug: string;
  title: string;
  date: string; // ISO
  dateLabel: string;
  excerpt: string;
  cover?: string; // nombre de archivo en /img (sin extensión)
  bodyHtml: string;
}

export const POSTS: Post[] = [
  {
    slug: "caso-exito-residencia-cuadrantes-en-segundos",
    title: "De medio día con el Excel a un cuadrante en segundos: el caso de una residencia",
    date: "2026-06-21",
    dateLabel: "21 de junio de 2026",
    excerpt:
      "Una residencia que funciona 24 horas, tres turnos y una plantilla con mil casuísticas. Así dejaron atrás el Excel de fin de mes y las discusiones por las noches.",
    cover: "sector-residencias",
    bodyHtml: `
      <p>En una residencia no se apaga la luz nunca. Hay alguien cuidando <strong>a las tres de la tarde, a las tres de la madrugada y el día de Navidad</strong>. Mañana, tarde y noche, los 365 días. Y detrás de esa tranquilidad para los residentes y sus familias hay un trabajo silencioso que casi nadie ve: <strong>cuadrar quién entra a cada turno</strong>.</p>
      <p>Os contamos cómo lo vivía una residencia con la que trabajamos —no diremos cuál— y qué cambió cuando dejaron de pelearse con la hoja de cálculo. Si gestionas un centro parecido, te va a sonar todo.</p>

      <h2>El punto de partida: medio día de Excel y alguna noche sin dormir</h2>
      <p>La responsable del centro dedicaba <strong>medio día largo cada mes</strong> a montar el cuadrante. No era solo repartir mañanas, tardes y noches entre las gerocultoras: era encajar un rompecabezas con reglas que no caben en la cabeza de nadie a la vez.</p>
      <ul>
        <li>Cubrir <strong>cada turno con el personal mínimo</strong>, todos los días, sin huecos.</li>
        <li>Respetar los <strong>descansos</strong> obligatorios y no encadenar demasiados días seguidos.</li>
        <li>Tener en cuenta a quien <strong>solo trabaja de lunes a viernes</strong>, a quien <strong>no hace noches</strong> y a quien tiene reducción de jornada.</li>
        <li>Cuadrarlo todo con <strong>vacaciones, festivos y permisos</strong> ya pedidos.</li>
        <li>Y que, además, <strong>el reparto fuese justo</strong>: que las noches y los fines de semana no cayeran siempre sobre las mismas.</li>
      </ul>
      <p>El resultado era previsible: muchas horas, algún error que se colaba, y la parte más ingrata… que cuando colgaba el cuadrante en el tablón, <strong>siempre había alguien que se quejaba</strong>. No por mala fe, sino porque a mano es imposible que todo quede equilibrado.</p>

      <h2>El cambio: las reglas las pone el centro, las cuentas las hace la plataforma</h2>
      <p>Lo primero que hicimos no fue darles “un programa más”. Fue <strong>escuchar cómo trabajaban</strong> y meter <em>sus</em> reglas dentro de la plataforma: sus tres turnos, su plantilla, sus excepciones reales. Las de verdad, no las de un manual.</p>
      <p>A partir de ahí, generar el cuadrante del mes pasó a ser <strong>pulsar un botón</strong>. La plataforma reparte mañanas, tardes y noches cumpliendo a la vez todas las condiciones: mínimos por turno, descansos, máximos de días seguidos, “esta solo de lunes a viernes”, “esta no hace noches”, vacaciones y preferencias. Lo que antes era medio día, <strong>ahora son segundos</strong>.</p>
      <p>¿Y si un día concreto, por números, es imposible cubrirlo con la gente disponible? No te deja tirada: <strong>genera igualmente el cuadrante y te avisa</strong> de qué falta y dónde, para que tú decidas (llamar a alguien, reorganizar) en lugar de descubrir el agujero a final de mes.</p>

      <h2>Lo que notó el equipo (que es lo que de verdad importa)</h2>
      <p>El cambio más bonito no fue para la dirección, sino para las gerocultoras. Cada una entra desde <strong>su móvil</strong> y ve <strong>su turno</strong>, sin tablón, sin fotos de WhatsApp y sin llamar para preguntar “¿yo mañana entro de tarde?”. Cuando se publica un cuadrante, <strong>les llega el aviso</strong>.</p>
      <ul>
        <li><strong>Su calendario del mes</strong> en el teléfono, y la opción de descargarlo.</li>
        <li><strong>Su ficha</strong> con sus datos y su foto.</li>
        <li>Acceso fácil y seguro, <strong>sin contraseñas que recordar</strong>.</li>
      </ul>
      <p>Y como el reparto lo hace la plataforma con las mismas reglas para todas, dejó de haber esa sensación de “a mí siempre me tocan las peores”. <strong>Cuando el reparto es transparente, las quejas bajan solas.</strong></p>

      <h2>El resumen, en una frase</h2>
      <p>La responsable lo contaba así: <em>“Antes el cuadrante me robaba la mañana entera y aún así alguien se enfadaba. Ahora lo tengo hecho en lo que tardo en tomarme un café, y el equipo lo ve en el móvil al momento.”</em></p>

      <h2>¿Sirve para tu residencia?</h2>
      <p>Si tu centro funciona a turnos 24 horas, el problema es el mismo en todas partes: cambian los nombres y los detalles, no la esencia. Y la plataforma no te obliga a cambiar tu forma de trabajar: <strong>se adapta a tus turnos, tus normas y tu plantilla</strong>, no al revés.</p>
      <p>Imagina llegar a fin de mes y que el cuadrante ya esté hecho, bien hecho, cumpliendo las reglas y sin discusiones. Para esta residencia dejó de ser un deseo. <strong>Puede serlo también para la tuya.</strong></p>
    `,
  },
  {
    slug: "gestor-cuadrantes-turnos-sin-excel",
    title: "¿Sigues haciendo los cuadrantes en Excel? Hay una forma mejor (y más rápida)",
    date: "2026-06-18",
    dateLabel: "18 de junio de 2026",
    excerpt:
      "Si gestionas un equipo a turnos, conoces la escena: fin de mes y una hoja de Excel imposible. Te contamos cómo dejar de pelearte con ella.",
    cover: "manager",
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
