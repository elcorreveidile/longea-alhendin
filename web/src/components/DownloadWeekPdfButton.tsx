"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WeekData } from "@/lib/week-cuadrantes";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const FILL: Record<string, [number, number, number]> = {
  M: [209, 250, 229], T: [254, 243, 199], N: [199, 210, 254],
  D: [241, 245, 249], V: [186, 230, 253], H: [255, 228, 230], HD: [255, 241, 242],
};

function dom(iso: string) {
  return Number(iso.split("-")[2]);
}

export default function DownloadWeekPdfButton({ data }: { data: WeekData }) {
  function download() {
    const { dates, weekdays, assignments, names } = data;
    const a = dates[0].split("-").map(Number);
    const b = dates[dates.length - 1].split("-").map(Number);
    const title =
      a[1] === b[1]
        ? `Semana del ${a[2]} al ${b[2]} de ${MONTHS[a[1]]} ${a[0]}`
        : `Semana del ${a[2]} de ${MONTHS[a[1]]} al ${b[2]} de ${MONTHS[b[1]]} ${b[0]}`;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(13);
    doc.text(title, 8, 9);

    const dayNums = dates.map((iso) => String(dom(iso)));
    const body = Object.entries(assignments).map(([id, states]) => [names?.[id] ?? id, ...states]);

    autoTable(doc, {
      startY: 12,
      head: [["Trabajadora", ...dayNums], ["", ...weekdays]],
      body,
      theme: "grid",
      styles: { fontSize: 8, halign: "center", valign: "middle", cellPadding: 1, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255, fontSize: 8, cellPadding: 1 },
      columnStyles: { 0: { halign: "left", cellWidth: 34, fontStyle: "bold" } },
      margin: { left: 6, right: 6 },
      didParseCell: (h) => {
        const col = h.column.index;
        if (h.section === "head" && col > 0 && ["S", "D"].includes(weekdays[col - 1])) {
          h.cell.styles.fillColor = [3, 105, 161];
        }
        if (h.section === "body" && col > 0) {
          const fill = FILL[String(h.cell.raw ?? "")];
          if (fill) h.cell.styles.fillColor = fill;
        }
      },
    });

    doc.save(`cuadrante-semana-${dates[0]}.pdf`);
  }

  return (
    <button
      onClick={download}
      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
    >
      Descargar PDF
    </button>
  );
}
