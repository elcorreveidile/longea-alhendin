"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface JustificanteData {
  empresa: string;
  teacher: string;
  courseLabel: string;
  targetH: string;
  reductionH: string;
  netH: string;
  doneH: string;
  restH: string;
  rows: { date: string; hours: string; concept: string; status: string }[];
}

export default function DownloadJustificante({ data }: { data: JustificanteData }) {
  function download() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFontSize(14);
    doc.text(`${data.empresa} · Justificante de horas`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`${data.teacher} — Curso ${data.courseLabel} (octubre–septiembre)`, 14, 23);

    autoTable(doc, {
      startY: 30,
      theme: "plain",
      styles: { fontSize: 9 },
      body: [
        ["A hacer (objetivo − reducción)", `${data.netH} h`],
        ["Reducción", `${data.reductionH} h`],
        ["Horas hechas", `${data.doneH} h`],
        ["Restante", `${data.restH} h`],
      ],
      columnStyles: { 0: { cellWidth: 80, textColor: 90 }, 1: { fontStyle: "bold" } },
      margin: { left: 14 },
      tableWidth: 110,
    });

    // @ts-expect-error lastAutoTable lo añade el plugin
    const y = (doc.lastAutoTable?.finalY ?? 60) + 6;
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Horas", "Concepto", "Estado"]],
      body: data.rows.map((r) => [r.date, r.hours, r.concept, r.status]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [8, 145, 178], textColor: 255 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });

    const now = new Date().toLocaleString("es-ES");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Documento generado el ${now}. Las horas confirmadas constan validadas por subdirección.`,
      14,
      doc.internal.pageSize.getHeight() - 10,
    );

    doc.save(`justificante-horas-${data.courseLabel}.pdf`);
  }

  return (
    <button
      onClick={download}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Descargar justificante (PDF)
    </button>
  );
}
