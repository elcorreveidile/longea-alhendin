/** Componentes de "hueco" para las imágenes que se subirán a /public/academia.
 *  Usan background-image por CSS: si el archivo aún no existe, el navegador
 *  ignora el 404 y se ve el degradado/fondo de marcador (queda intencional).
 *  En cuanto subas la imagen con el nombre acordado, aparece sola. */

const TEAL_OVERLAY = "linear-gradient(to top, rgba(8,79,94,.88), rgba(8,79,94,.30))";

/** Envoltorio con imagen de fondo a toda la página detrás del contenido.
 *  Mismo patrón que el hero: velo crema por encima de la foto (legibilidad) y
 *  el contenido como hijos. `fade` = opacidad del velo (más alto = más sutil).
 *  background-attachment: fixed => fijo en escritorio; en móvil cae a flotante. */
export function WithBackground({
  src,
  fade = 0.86,
  children,
}: {
  src: string;
  fade?: number;
  children: React.ReactNode;
}) {
  const veil = `linear-gradient(rgba(250,246,238,${fade}), rgba(250,246,238,${fade}))`;
  return (
    <div
      style={{
        backgroundImage: `${veil}, url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </div>
  );
}

/** Banner de cabecera (fondos 16:9 de área / hero). Texto blanco encima. */
export function Banner({
  src,
  className = "",
  children,
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-cyan-800 ${className}`}
      style={{ backgroundImage: `${TEAL_OVERLAY}, url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {children}
    </div>
  );
}

/** Hueco para ilustración spot (fondo crema; la ilustración se centra encima). */
export function Spot({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div
      className={`rounded-xl bg-[#faf6ee] ${className}`}
      style={{ backgroundImage: `url(${src})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
      aria-hidden
    />
  );
}
