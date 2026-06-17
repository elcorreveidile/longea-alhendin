"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CuadranteData } from "@/components/Cuadrante";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Colores de relleno por estado (RGB), a juego con la leyenda.
const FILL: Record<string, [number, number, number]> = {
  M: [209, 250, 229], T: [254, 243, 199], N: [199, 210, 254],
  D: [241, 245, 249], V: [186, 230, 253], H: [255, 228, 230], HD: [255, 241, 242],
};

export default function DownloadPdfButton({ data }: { data: CuadranteData }) {
  function download() {
    const { year, month, days, weekdays, assignments, names } = data;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(13);
    doc.text(`Cuadrante · ${MONTHS[month]} ${year}`, 8, 9);

    const dayNums = Array.from({ length: days }, (_, i) => String(i + 1));
    const body = Object.entries(assignments).map(([id, states]) => [
      names?.[id] ?? id,
      ...states,
    ]);

    autoTable(doc, {
      startY: 12,
      head: [["Trabajadora", ...dayNums], ["", ...weekdays]],
      body,
      theme: "grid",
      styles: { fontSize: 5, halign: "center", valign: "middle", cellPadding: 0.4, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontSize: 5.5, cellPadding: 0.4 },
      columnStyles: { 0: { halign: "left", cellWidth: 24, fontStyle: "bold" } },
      margin: { left: 6, right: 6 },
      didParseCell: (h) => {
        const col = h.column.index;
        // Sombrear columnas de fin de semana en la cabecera.
        if (h.section === "head" && col > 0 && ["S", "D"].includes(weekdays[col - 1])) {
          h.cell.styles.fillColor = [3, 105, 161];
        }
        // Colorear celdas de turno en el cuerpo.
        if (h.section === "body" && col > 0) {
          const code = String(h.cell.raw ?? "");
          const fill = FILL[code];
          if (fill) h.cell.styles.fillColor = fill;
        }
      },
    });

    doc.save(`cuadrante-${MONTHS[month]}-${year}.pdf`);
  }

  return (
    <button
      onClick={download}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Descargar PDF
    </button>
  );
}
