import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getLatestCuadrante, getCuadrante, type CuadranteJSON } from "@/db/cuadrantes";
import { getWeek } from "@/lib/week-cuadrantes";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Colores de relleno por estado (ARGB), a juego con la leyenda de la web.
const FILL: Record<string, string> = {
  M: "FFD1FAE5", T: "FFFEF3C7", N: "FFC7D2FE",
  D: "FFF1F5F9", V: "FFBAE6FD", H: "FFFFE4E6", HD: "FFFFF1F2",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Sin residencia" }, { status: 404 });
  }
  const sp = req.nextUrl.searchParams;
  const weekStart = sp.get("week");

  // Datos normalizados (sirve para mes o semana).
  let sheetName: string;
  let filename: string;
  let dayLabels: string[]; // número de día por columna
  let weekdays: string[];
  let assignments: Record<string, string[]>;
  let names: Record<string, string>;

  if (weekStart) {
    const week = await getWeek(tenant.id, weekStart);
    if (!week) return NextResponse.json({ error: "No hay semana guardada" }, { status: 404 });
    weekdays = week.weekdays;
    assignments = week.assignments;
    names = week.names ?? {};
    dayLabels = week.dates.map((iso) => String(Number(iso.split("-")[2])));
    sheetName = `Semana ${weekStart}`;
    filename = `cuadrante-semana-${weekStart}.xlsx`;
  } else {
    const y = Number(sp.get("year"));
    const m = Number(sp.get("month"));
    const row = y && m ? await getCuadrante(tenant.id, y, m) : await getLatestCuadrante(tenant.id);
    if (!row) {
      return NextResponse.json({ error: "No hay cuadrante guardado" }, { status: 404 });
    }
    const data = row.data as CuadranteJSON & { names?: Record<string, string> };
    weekdays = data.weekdays;
    assignments = data.assignments;
    names = data.names ?? {};
    dayLabels = Array.from({ length: data.days }, (_, i) => String(i + 1));
    sheetName = `${MONTHS[data.month]} ${data.year}`;
    filename = `cuadrante-${MONTHS[data.month]}-${data.year}.xlsx`;
  }
  const days = dayLabels.length;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // Cabecera: dos filas (número de día / letra del día de la semana).
  const dayNums = ["Trabajadora", ...dayLabels];
  const dayLetters = ["", ...weekdays];
  const hdr1 = ws.addRow(dayNums);
  const hdr2 = ws.addRow(dayLetters);
  for (const hr of [hdr1, hdr2]) {
    hr.font = { bold: true, size: 10 };
    hr.alignment = { horizontal: "center", vertical: "middle" };
    hr.eachCell((cell, col) => {
      const isWeekend = col > 1 && ["S", "D"].includes(weekdays[col - 2]);
      cell.fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: isWeekend ? "FFE2E8F0" : "FFF8FAFC" },
      };
      cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
    });
  }

  // Filas de trabajadoras.
  for (const [id, states] of Object.entries(assignments)) {
    const r = ws.addRow([names[id] ?? id, ...states]);
    r.height = 16;
    r.eachCell((cell, col) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font = { size: 10 };
      if (col === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.font = { size: 10, bold: true };
        return;
      }
      const code = String(cell.value ?? "");
      const fill = FILL[code];
      if (fill) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      }
      cell.border = { right: { style: "hair", color: { argb: "FFE2E8F0" } } };
    });
  }

  ws.getColumn(1).width = 18;
  for (let c = 2; c <= days + 1; c++) ws.getColumn(c).width = 3.5;

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
