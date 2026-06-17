"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const FULL: Record<string, string> = { M: "Mañana", T: "Tarde", N: "Noche", D: "Descanso", V: "Vacaciones" };
const HOURS: Record<string, string> = { M: "07:00–14:30", T: "14:30–22:00", N: "22:00–07:00" };
const DAYNAME: Record<string, string> = { L: "Lunes", M: "Martes", X: "Miércoles", J: "Jueves", V: "Viernes", S: "Sábado", D: "Domingo" };
const FILL: Record<string, [number, number, number]> = {
  M: [209, 250, 229], T: [254, 243, 199], N: [199, 210, 254], D: [241, 245, 249], V: [186, 230, 253],
};

export default function DownloadMyMonthButton({
  name,
  year,
  month,
  weekdays,
  row,
}: {
  name: string;
  year: number;
  month: number;
  weekdays: string[];
  row: string[];
}) {
  function download() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(15);
    doc.text(`Mi turno · ${MONTHS[month]} ${year}`, 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(name, 14, 23);
    doc.setTextColor(0);

    const body = row.map((code, i) => {
      const c = code?.[0] ?? "";
      return [String(i + 1), DAYNAME[weekdays[i]] ?? weekdays[i], FULL[c] ?? code ?? "", HOURS[c] ?? ""];
    });

    autoTable(doc, {
      startY: 28,
      head: [["Día", "", "Turno", "Horario"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255 },
      columnStyles: { 0: { halign: "center", cellWidth: 14 }, 1: { cellWidth: 28 }, 3: { cellWidth: 34 } },
      didParseCell: (h) => {
        if (h.section === "body") {
          const c = row[h.row.index]?.[0] ?? "";
          const fill = FILL[c];
          if (fill) h.cell.styles.fillColor = fill;
          const wl = weekdays[h.row.index];
          if ((wl === "S" || wl === "D") && h.column.index <= 1) h.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`mi-turno-${MONTHS[month]}-${year}.pdf`);
  }

  return (
    <button
      onClick={download}
      className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
    >
      Descargar mi mes (PDF)
    </button>
  );
}
