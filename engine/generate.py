#!/usr/bin/env python3
"""
Generador automático de cuadrantes - Residencia Alhendín (Teresa Montes / Grupo Longea)

Modela el cuadrante mensual como un problema de asignación de turnos
(nurse rostering) y lo resuelve con Google OR-Tools (CP-SAT).

Reglas DURAS (no se pueden romper):
  - Cada trabajadora tiene exactamente un estado al día: M (mañana), T (tarde),
    N (noche), D (descanso) o V (vacaciones, fijado de antemano).
  - Cobertura diaria: 9 mañana + 9 tarde + 2 noche (configurable).
  - Tras una noche, al día siguiente no se hace mañana ni tarde (solo N o D).
  - Máximo de días seguidos trabajando (por defecto 6).
  - Al menos un bloque de 36 h de descanso (2 días seguidos) cada 14 días.
  - Un domingo libre al mes como mínimo por persona.
  - M.Mar: solo de lunes a viernes en turno de mañana (finde libre).
  - Supervisoras: no hacen noches; patrón ligero (no cuentan en la cobertura
    de las 9, salvo que se configure lo contrario).

Reglas BLANDAS (el motor intenta repartirlas con justicia):
  - Repartir las noches de forma equilibrada entre las gerocultoras.
  - Repartir los domingos/findes libres de forma equitativa.

La cobertura se modela con holgura penalizada: si por números NO es posible
cubrir un turno, el motor devuelve igualmente un cuadrante y REPORTA el déficit
(en vez de fallar sin más). Así Diana ve exactamente qué días no cuadran.
"""

import argparse
import calendar
import json
import sys
from collections import defaultdict

from ortools.sat.python import cp_model

WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"]  # lunes=0 ... domingo=6
WORK_SHIFTS = ["M", "T", "N"]
ALL_STATES = ["M", "T", "N", "D"]  # V se fija aparte


def load_config(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_calendar(year, month):
    days = calendar.monthrange(year, month)[1]
    weekdays = [calendar.weekday(year, month, d) for d in range(1, days + 1)]
    sundays = [i for i, wd in enumerate(weekdays) if wd == 6]
    return days, weekdays, sundays


def weekly_rest_warnings(assignments, weekdays, shift_hours, workers):
    """Comprueba, con los horarios reales, qué semanas (L-D completas) no tienen
    un descanso continuo de >=36h por persona. Devuelve la lista de avisos."""
    name_by_id = {w["id"]: w.get("name", w["id"]) for w in workers}
    days = len(weekdays)
    wd0 = weekdays[0]

    def busy_intervals(row):
        ivs = []
        for d, s in enumerate(row):
            hrs = shift_hours.get(s)
            if hrs:  # solo turnos de trabajo (M/T/N); D/V no tienen horario
                ivs.append((d * 24 + hrs[0], d * 24 + hrs[1]))
        ivs.sort()
        return ivs

    # Semanas L-D completas
    weeks = {}
    for d in range(days):
        weeks.setdefault((d + wd0) // 7, []).append(d)
    full_weeks = [ds for ds in weeks.values() if len(ds) == 7]

    warnings = []
    for wid, row in assignments.items():
        ivs = busy_intervals(row)
        # Sentinelas en los límites del mes: el descanso al principio/fin (p. ej.
        # antes de empezar tras vacaciones) también cuenta.
        bounds = [(0, 0)] + ivs + [(days * 24, days * 24)]
        gaps = [(bounds[i][1], bounds[i + 1][0]) for i in range(len(bounds) - 1)]
        rest36 = [(g0, g1) for (g0, g1) in gaps if g1 - g0 >= 36]
        for ds in full_weeks:
            ws_h, we_h = ds[0] * 24, (ds[-1] + 1) * 24
            all_rest = all(row[d] in ("D", "V") for d in ds)
            covered = all_rest or any(g0 < we_h and g1 > ws_h for (g0, g1) in rest36)
            if not covered:
                warnings.append({
                    "worker": wid,
                    "name": name_by_id.get(wid, wid),
                    "from_day": ds[0] + 1,
                    "to_day": ds[-1] + 1,
                })
    return warnings


def solve(cfg):
    year, month = cfg["year"], cfg["month"]
    days, weekdays, sundays = build_calendar(year, month)
    workers = cfg["workers"]
    cov = cfg["coverage"]
    rules = cfg.get("rules", {})
    max_consec = rules.get("max_consecutive_work_days", 6)
    rest_block_window = rules.get("rest_block_window_days", 14)
    sundays_off_min = rules.get("sunday_off_per_month", 1)
    night_then_rest = rules.get("no_morning_or_afternoon_after_night", True)
    sup_in_coverage = cfg.get("supervisors_count_in_coverage", False)

    model = cp_model.CpModel()

    # Estados permitidos por rol y por restricciones individuales.
    def allowed_states(w):
        role = w["role"]
        if role == "supervisora":
            base = ["M", "T", "D"]
        else:
            base = ["M", "T", "N", "D"]

        # only_shift: la persona solo hace un turno concreto (p. ej. Noemí, solo T)
        only = w.get("only_shift")
        if only:
            base = [s for s in base if s == only or s == "D"]
        # no_night: la persona no hace noches (Rocío, Mar, Diego, Noemí...)
        if w.get("no_night") and "N" in base:
            base = [s for s in base if s != "N"]
        return base

    # Días de vacaciones (fijados) por trabajadora
    vac = {w["id"]: set(w.get("vacations", [])) for w in workers}

    # x[wid, day, state] = 1 si la trabajadora hace ese estado ese día
    x = {}
    for w in workers:
        wid = w["id"]
        states = allowed_states(w)
        for d in range(days):
            day_num = d + 1
            if day_num in vac[wid]:
                # Vacaciones: no se decide, está fijado
                continue
            for s in states:
                x[wid, d, s] = model.NewBoolVar(f"x_{wid}_{d}_{s}")
            # Exactamente un estado por día
            model.AddExactlyOne(x[wid, d, s] for s in states)

    def is_state(wid, d, s):
        """Devuelve la variable/constante de que (wid, d) == s, contando vacaciones."""
        day_num = d + 1
        if day_num in vac[wid]:
            return 1 if s == "V" else 0
        return x.get((wid, d, s), 0)

    def works(wid, d):
        """1 si trabaja (M/T/N) ese día (no D ni V)."""
        day_num = d + 1
        if day_num in vac[wid]:
            return 0
        w = next(ww for ww in workers if ww["id"] == wid)
        return sum(x[wid, d, s] for s in allowed_states(w) if s in WORK_SHIFTS)

    def rest_ind(wid, d):
        """1 si descansa: descanso (D) o vacaciones (V) cuentan como descanso."""
        if (d + 1) in vac[wid]:
            return 1
        return is_state(wid, d, "D")

    # --- M.Mar: solo L-V mañana ---
    for w in workers:
        if w["role"] != "gerocultora_lv":
            continue
        wid = w["id"]
        for d in range(days):
            if d + 1 in vac[wid]:
                continue
            if weekdays[d] < 5:  # lunes-viernes
                model.Add(x[wid, d, "M"] == 1)
            else:  # finde libre
                model.Add(x[wid, d, "D"] == 1)

    # --- Cobertura diaria (con holgura penalizada) ---
    def in_coverage(w):
        if w["role"] == "supervisora":
            return sup_in_coverage
        return True

    deficit_terms = []
    for d in range(days):
        for s in WORK_SHIFTS:
            req = cov.get(s, 0)
            assigned = []
            for w in workers:
                if not in_coverage(w):
                    continue
                if s == "N" and w["role"] == "supervisora":
                    continue
                assigned.append(is_state(w["id"], d, s))
            deficit = model.NewIntVar(0, req, f"def_{d}_{s}")
            surplus = model.NewIntVar(0, len(workers), f"sur_{d}_{s}")
            model.Add(sum(assigned) + deficit - surplus == req)
            deficit_terms.append(deficit)
            # Pequeña penalización al exceso para no malgastar personal
            deficit_terms.append(surplus)

    # --- Tras noche, descanso (no mañana/tarde al día siguiente) ---
    if night_then_rest:
        for w in workers:
            if "N" not in allowed_states(w):
                continue
            wid = w["id"]
            for d in range(days - 1):
                if d + 1 in vac[wid] or d + 2 in vac[wid]:
                    continue
                # Si N hoy -> mañana no M ni T
                model.Add(x[wid, d + 1, "M"] == 0).OnlyEnforceIf(x[wid, d, "N"])
                model.Add(x[wid, d + 1, "T"] == 0).OnlyEnforceIf(x[wid, d, "N"])

    # --- Descanso mínimo entre jornadas (12h por defecto) ---
    # Prohíbe encadenar turnos con menos de 'min_hours_between_shifts' horas de
    # descanso. Con los horarios reales, esto veta p. ej. Tarde -> Mañana (9h).
    min_gap = rules.get("min_hours_between_shifts", 12)
    sh = cfg.get("shift_hours", {})
    forbidden_pairs = []
    for s1 in WORK_SHIFTS:
        for s2 in WORK_SHIFTS:
            if s1 in sh and s2 in sh:
                gap = (sh[s2][0] + 24) - sh[s1][1]  # fin de s1 (día d) -> inicio s2 (día d+1)
                if gap < min_gap:
                    forbidden_pairs.append((s1, s2))
    for w in workers:
        wid = w["id"]
        allowed = allowed_states(w)
        for d in range(days - 1):
            if d + 1 in vac[wid] or d + 2 in vac[wid]:
                continue
            for s1, s2 in forbidden_pairs:
                if s1 in allowed and s2 in allowed:
                    model.Add(x[wid, d + 1, s2] == 0).OnlyEnforceIf(x[wid, d, s1])

    # --- Máximo de días seguidos trabajando ---
    for w in workers:
        wid = w["id"]
        for start in range(days - max_consec):
            window = [works(wid, d) for d in range(start, start + max_consec + 1)]
            model.Add(sum(window) <= max_consec)

    # --- Bloque de 36h (2 días seguidos de descanso) cada 'rest_block_window' días ---
    # Mínimo legal (suelo). Además, en el objetivo se incentivan más bloques para
    # acercarse al descanso semanal. Las semanas sin 36h se reportan después.
    all_blocks = []
    for w in workers:
        wid = w["id"]
        # variable bloque b[d] = D[d] AND D[d+1]
        block = {}
        for d in range(days - 1):
            bd = model.NewBoolVar(f"block_{wid}_{d}")
            d0 = rest_ind(wid, d)
            d1 = rest_ind(wid, d + 1)
            # bd <= d0, bd <= d1, bd >= d0+d1-1
            if isinstance(d0, int) and isinstance(d1, int):
                model.Add(bd == (1 if d0 and d1 else 0))
            else:
                model.Add(bd <= d0) if not isinstance(d0, int) else None
                model.Add(bd <= d1) if not isinstance(d1, int) else None
                model.Add(bd >= d0 + d1 - 1)
            block[d] = bd
            all_blocks.append(bd)
        for start in range(0, max(1, days - rest_block_window + 1)):
            window = [block[d] for d in range(start, min(start + rest_block_window - 1, days - 1))]
            if window:
                model.Add(sum(window) >= 1)

    # --- Un domingo libre al mes ---
    for w in workers:
        wid = w["id"]
        if w["role"] == "gerocultora_lv":
            continue  # M.Mar libra todos los domingos
        # Un domingo de descanso/vacaciones al mes como mínimo.
        model.Add(sum(rest_ind(wid, sd) for sd in sundays) >= sundays_off_min)

    # --- Supervisoras: patrón 3 mañanas / 2 tardes / 2 descansos, sin noches ---
    # (Diana: "2 mañanas, 2 tardes, 2 descansos y al 7º día entra de mañana".)
    for w in workers:
        if w["role"] != "supervisora":
            continue
        wid = w["id"]
        weeks = defaultdict(list)
        for d in range(days):
            iso_week = (d + weekdays[0]) // 7
            weeks[iso_week].append(d)
        for wk, wdays in weeks.items():
            avail = [d for d in wdays if (d + 1) not in vac[wid]]
            n_m = sum(is_state(wid, d, "M") for d in wdays)
            n_t = sum(is_state(wid, d, "T") for d in wdays)
            if len(wdays) == 7 and len(avail) == 7:
                # semana completa sin vacaciones -> 3 mañanas / 2 tardes / 2 descansos
                model.Add(n_m == 3)
                model.Add(n_t == 2)
            else:
                # semana parcial o con vacaciones -> topes + algo de trabajo si puede
                model.Add(n_m <= 3)
                model.Add(n_t <= 2)
                if len(avail) >= 4:
                    model.Add(n_m + n_t >= 2)

    # --- Objetivo: minimizar déficit de cobertura y equilibrar noches ---
    # Solo se equilibran las noches entre quienes PUEDEN hacerlas (excluye
    # supervisoras, M.Mar y quienes no hacen noches); si no, su "0" falseaba
    # el reparto.
    nights = []
    for w in workers:
        if "N" not in allowed_states(w):
            continue
        wid = w["id"]
        n = model.NewIntVar(0, days, f"nights_{wid}")
        model.Add(n == sum(is_state(wid, d, "N") for d in range(days)))
        nights.append(n)
    # Minimizar la suma de cuadrados de las noches reparte de forma uniforme
    # (penaliza tanto al que tiene de más como al que tiene de menos).
    sq_terms = []
    for i, n in enumerate(nights):
        sq = model.NewIntVar(0, days * days, f"nightsq_{i}")
        model.AddMultiplicationEquality(sq, [n, n])
        sq_terms.append(sq)
    night_balance = sum(sq_terms) if sq_terms else 0

    # Coberturas (1000) >> equilibrio de noches (15) > bloques de 36h (5).
    model.Minimize(1000 * sum(deficit_terms) + 15 * night_balance - 5 * sum(all_blocks))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = cfg.get("time_limit_seconds", 30)
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"ok": False, "status": solver.StatusName(status)}

    # --- Extraer solución ---
    assignments = {}
    for w in workers:
        wid = w["id"]
        row = []
        for d in range(days):
            if d + 1 in vac[wid]:
                row.append("V")
                continue
            placed = "?"
            for s in allowed_states(w):
                if solver.Value(x[wid, d, s]) == 1:
                    placed = s
                    break
            row.append(placed)
        assignments[wid] = row

    # --- Reportar déficits de cobertura ---
    violations = []
    for d in range(days):
        for s in WORK_SHIFTS:
            req = cov.get(s, 0)
            count = sum(
                1 for w in workers
                if in_coverage(w) and not (s == "N" and w["role"] == "supervisora")
                and assignments[w["id"]][d] == s
            )
            if count < req:
                violations.append({
                    "day": d + 1, "shift": s,
                    "required": req, "assigned": count, "short": req - count,
                })

    # --- Reportar semanas sin 36h de descanso continuo ---
    rest_warnings = weekly_rest_warnings(
        assignments, weekdays, cfg.get("shift_hours", {}), workers
    )

    return {
        "ok": True,
        "status": solver.StatusName(status),
        "year": year, "month": month, "days": days,
        "rest_warnings": rest_warnings,
        "weekdays": [WEEKDAY_LETTERS[wd] for wd in weekdays],
        "assignments": assignments,
        "violations": violations,
        "objective": solver.ObjectiveValue(),
    }


def main():
    ap = argparse.ArgumentParser(description="Generador de cuadrantes (CP-SAT)")
    ap.add_argument("config", help="Ruta al JSON de configuración")
    ap.add_argument("-o", "--output", default="output.json", help="Fichero de salida")
    args = ap.parse_args()

    cfg = load_config(args.config)
    result = solve(cfg)

    if not result["ok"]:
        print(f"❌ No se encontró solución: {result['status']}", file=sys.stderr)
        sys.exit(1)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    n_viol = len(result["violations"])
    print(f"✅ Cuadrante generado ({result['status']}) -> {args.output}")
    print(f"   {result['days']} días, {len(result['assignments'])} trabajadoras")
    if n_viol:
        print(f"   ⚠️  {n_viol} déficit(s) de cobertura (ver 'violations' en el JSON)")
    else:
        print("   ✓ Cobertura cumplida todos los días")


if __name__ == "__main__":
    main()
