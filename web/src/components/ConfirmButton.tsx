"use client";

/**
 * Botón de envío que pide confirmación antes de ejecutar la acción del
 * formulario (p. ej. borrados). Si el usuario cancela, no se envía.
 */
export default function ConfirmButton({
  children,
  className,
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  confirm: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
