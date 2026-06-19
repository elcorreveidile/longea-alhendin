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


def build_calendar_range(start_iso, num_days):
    """Calendario para un rango arbitrario (p. ej. una semana) a partir de una
    fecha ISO 'YYYY-MM-DD'. Devuelve también la lista de fechas ISO por día."""
    import datetime

    y, m, d = (int(p) for p in start_iso.split("-"))
    d0 = datetime.date(y, m, d)
    dates = [d0 + datetime.timedelta(days=i) for i in range(num_days)]
    weekdays = [dt.weekday() for dt in dates]
    sundays = [i for i, wd in enumerate(weekdays) if wd == 6]
    return num_days, weekdays, sundays, [dt.isoformat() for dt in dates]


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


def assign_floors(assignments, workers, days):
    """Reparte las plantas (0/1/2) sobre el cuadrante ya resuelto.

    Reglas de Diana: en cada turno de mañana y de tarde, 4 personas en planta 2
    (rosa), 4 en planta 1 (verde) y 1 en planta 0 (azul). Las supervisoras (gris)
    y las noches (negro) no llevan planta. Quien tiene 'fixed_floor' (p. ej. Mar
    en planta 0) va siempre a esa planta cuando trabaja; el resto se mantiene
    estable en su planta de un día para otro (continuidad de cuidados) y, si no,
    se reparte para cumplir 4/4/1.

    Devuelve floors: {wid: [planta|None por día]} (None en noche/descanso/super).
    """
    role_by = {w["id"]: w["role"] for w in workers}
    fixed = {w["id"]: w.get("fixed_floor") for w in workers}
    floors = {wid: [None] * days for wid in assignments}
    last_floor = {}  # continuidad: última planta asignada a cada trabajadora
    TARGET = {2: 4, 1: 4, 0: 1}

    for d in range(days):
        for shift in ("M", "T"):
            present = [
                w["id"] for w in workers
                if role_by.get(w["id"]) != "supervisora"
                and assignments.get(w["id"], [None] * days)[d] == shift
            ]
            if not present:
                continue
            cap = dict(TARGET)
            chosen = {}
            # 1) plantas fijas (Mar -> 0) primero
            for wid in present:
                f = fixed.get(wid)
                if f in (0, 1, 2) and cap.get(f, 0) > 0:
                    chosen[wid] = f
                    cap[f] -= 1
            # 2) continuidad: mantener la planta de ayer si aún cabe
            for wid in present:
                if wid in chosen:
                    continue
                lf = last_floor.get(wid)
                if lf is not None and cap.get(lf, 0) > 0:
                    chosen[wid] = lf
                    cap[lf] -= 1
            # 3) rellenar el resto para cumplir 4/4/1 (planta con más hueco)
            for wid in present:
                if wid in chosen:
                    continue
                choice = max((2, 1, 0), key=lambda f: cap[f])
                if cap[choice] <= 0:
                    choice = 2  # excedente de personal: a planta 2
                chosen[wid] = choice
                if cap.get(choice, 0) > 0:
                    cap[choice] -= 1
            for wid, f in chosen.items():
                floors[wid][d] = f
                last_floor[wid] = f
    return floors


def _attempt(cfg, hard_coverage):
    if cfg.get("start_date"):
        # Modo semana (o rango de N días) a partir de una fecha.
        year = month = None
        days, weekdays, sundays, dates = build_calendar_range(
            cfg["start_date"], int(cfg.get("num_days", 7))
        )
    else:
        year, month = cfg["year"], cfg["month"]
        days, weekdays, sundays = build_calendar(year, month)
        dates = None
    workers = cfg["workers"]
    cov = cfg["coverage"]
    rules = cfg.get("rules", {})
    max_consec = rules.get("max_consecutive_work_days", 6)
    rest_block_window = rules.get("rest_block_window_days", 14)
    sundays_off_min = rules.get("sunday_off_per_month", 1)
    night_then_rest = rules.get("no_morning_or_afternoon_after_night", True)
    # Descanso tras racha larga: tras 'threshold' días seguidos trabajando se
    # exigen 'min_rest' descansos seguidos (queja de Diana del "6 + 1 descanso").
    rest_after = rules.get("rest_after_streak") or {}
    streak_threshold = int(rest_after.get("threshold", 5))
    streak_min_rest = int(rest_after.get("min_rest", 2))
    # Máximo de descansos (D) seguidos; 0 = sin límite. Las vacaciones (V) no cuentan.
    max_rest_run = int(rules.get("max_consecutive_rest_days", 0))
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
    surplus_terms = []
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
            surplus = model.NewIntVar(0, len(workers), f"sur_{d}_{s}")
            if hard_coverage:
                # Cobertura mínima GARANTIZADA: nunca por debajo de lo requerido.
                model.Add(sum(assigned) - surplus == req)
            else:
                # Modo de respaldo (mes imposible): se permite déficit y se reporta.
                deficit = model.NewIntVar(0, req, f"def_{d}_{s}")
                model.Add(sum(assigned) + deficit - surplus == req)
                deficit_terms.append(deficit)
            # Pequeña penalización al exceso para no malgastar personal
            surplus_terms.append(surplus)

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
    # M.Mar (L-V fijo) y supervisoras tienen patrón propio; se eximen para que
    # bajar el máximo no genere conflictos imposibles.
    for w in workers:
        if w["role"] in ("gerocultora_lv", "supervisora"):
            continue
        wid = w["id"]
        for start in range(days - max_consec):
            window = [works(wid, d) for d in range(start, start + max_consec + 1)]
            model.Add(sum(window) <= max_consec)

    # --- Continuidad con el mes anterior ("cola" de días previos) ---
    # Si la trabajadora acabó el mes anterior en noche, el día 1 es descanso; si
    # acabó con una racha de días seguidos, se arrastra al máximo; y se respeta
    # el descanso entre jornadas a través del límite (p. ej. Tarde -> Mañana).
    for w in workers:
        wid = w["id"]
        tail = w.get("prev_tail") or []
        if not tail:
            continue
        allowed = allowed_states(w)
        last = tail[-1]
        day0_vac = (1 in vac[wid])
        if not day0_vac:
            # 1) Acabó en noche -> el día 1 descansa
            if last == "N" and "D" in allowed and (wid, 0, "D") in x:
                model.Add(x[wid, 0, "D"] == 1)
            # 2) Descanso entre jornadas a través del límite (T->M, N->M, N->T...)
            for s1, s2 in forbidden_pairs:
                if last == s1 and (wid, 0, s2) in x:
                    model.Add(x[wid, 0, s2] == 0)
        # 3) Arrastrar la racha de días seguidos trabajando (no a M.Mar/supervisora)
        if w["role"] not in ("gerocultora_lv", "supervisora"):
            t = 0
            for s in reversed(tail):
                if s in WORK_SHIFTS:
                    t += 1
                else:
                    break
            if t > 0:
                rem = max_consec - t  # días que aún puede encadenar al principio
                if rem <= 0:
                    if not day0_vac:
                        model.Add(works(wid, 0) == 0)  # ya alcanzó el máximo
                else:
                    win = min(rem + 1, days)
                    model.Add(sum(works(wid, d) for d in range(win)) <= rem)

    # --- Descanso tras racha larga (preferencia fuerte, no obligación) ---
    # Tras 'streak_threshold' días seguidos trabajando, si se descansa, el
    # descanso debería ser de al menos 'streak_min_rest' días seguidos (no 1
    # suelto). Es SOFT: si no hay forma de cumplirlo, se penaliza pero el
    # cuadrante se genera igualmente (nunca lo deja sin solución).
    streak_slacks = []
    if streak_threshold and streak_min_rest >= 2:
        T = streak_threshold
        for w in workers:
            wid = w["id"]
            for d in range(T - 1, days - 1):
                window = sum(works(wid, j) for j in range(d - T + 1, d + 1))
                for r in range(2, streak_min_rest + 1):
                    if d + r >= days:
                        break
                    mids = sum(rest_ind(wid, d + k) for k in range(1, r))
                    slack = model.NewBoolVar(f"streakslack_{wid}_{d}_{r}")
                    model.Add(window + mids + works(wid, d + r) <= T + (r - 1) + slack)
                    streak_slacks.append(slack)

    # --- Tope de descansos (D) seguidos (preferencia fuerte, no obligación) ---
    # Evita "demasiados descansos juntos" (p. ej. 3 seguidos). Las vacaciones (V)
    # no cuentan como descanso aquí. Es SOFT: penaliza pero no impide generar.
    rest_run_slacks = []
    if max_rest_run >= 1:
        for w in workers:
            wid = w["id"]
            for start in range(days - max_rest_run):
                window = sum(is_state(wid, start + k, "D") for k in range(max_rest_run + 1))
                slack = model.NewBoolVar(f"restrun_{wid}_{start}")
                model.Add(window <= max_rest_run + slack)
                rest_run_slacks.append(slack)

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

    # --- Supervisoras: ciclo continuo 2 mañanas / 2 tardes / 2 descansos, sin
    # noches, y SIEMPRE al menos una supervisora cubriendo cada día. ---
    # Diana: "Dos mañanas, dos tardes, dos descansos para supervisoras siempre"
    # y "la supervisora siempre tiene que haber una cubriendo".
    #
    # El ritmo 2-2-2 se modela sobre TODAS las ventanas de 6 días consecutivos
    # (incluidas las que cruzan la frontera con el mes anterior, usando la cola
    # 'prev_tail'): exigir 2M+2T en cada ventana de 6 fuerza el ciclo periódico y
    # lo enlaza con cómo venía cada supervisora de junio. Es PREFERENCIA FUERTE
    # (con holgura penalizada), no obligación, para no dejar nunca el mes sin
    # solución cuando hay vacaciones: si no se puede, el motor lo respeta al
    # máximo y la administradora ajusta a mano.
    supervisoras = [w for w in workers if w["role"] == "supervisora"]
    sup_pattern_slacks = []
    sup_cover_slacks = []

    for w in supervisoras:
        wid = w["id"]
        tail = list(w.get("prev_tail") or [])

        def sup_term(d, s, wid=wid, tail=tail):
            """Indicador de que la supervisora hace el estado s el día d.
            d negativo = días del mes anterior (constantes de la cola)."""
            if d < 0:
                idx = len(tail) + d
                return 1 if (0 <= idx < len(tail) and tail[idx] == s) else 0
            if (d + 1) in vac[wid]:
                return 1 if s == "V" else 0
            return is_state(wid, d, s)

        def sup_has_vac(d, wid=wid, tail=tail):
            if d < 0:
                return (len(tail) + d) < 0  # fuera de la cola: ventana no evaluable
            return (d + 1) in vac[wid]

        # Ventanas de 6 días: desde -min(len(tail),5) hasta el final del mes.
        for start in range(-min(len(tail), 5), days - 5):
            win = list(range(start, start + 6))
            if any(sup_has_vac(d) for d in win):
                continue  # ventana con vacaciones o fuera de la cola: no se fuerza
            n_m = sum(sup_term(d, "M") for d in win)
            n_t = sum(sup_term(d, "T") for d in win)
            for n_expr, lbl in ((n_m, "m"), (n_t, "t")):
                pos = model.NewIntVar(0, 4, f"suppat_pos_{wid}_{start}_{lbl}")
                neg = model.NewIntVar(0, 4, f"suppat_neg_{wid}_{start}_{lbl}")
                model.Add(n_expr - 2 == pos - neg)  # desviación respecto a 2
                sup_pattern_slacks.append(pos)
                sup_pattern_slacks.append(neg)

    # Cobertura conjunta: cada día, al menos una supervisora trabajando.
    if supervisoras:
        for d in range(days):
            present = []
            for w in supervisoras:
                wid = w["id"]
                if (d + 1) in vac[wid]:
                    continue  # de vacaciones no cubre
                present.append(works(wid, d))
            if not present:
                continue
            nobody = model.NewBoolVar(f"supcov_{d}")  # 1 si NADIE cubre ese día
            model.Add(sum(present) + nobody >= 1)
            sup_cover_slacks.append(nobody)

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

    # Déficit (1000, solo en respaldo) >> equilibrio de noches (15) > bloques de
    # 36h (5) > exceso de personal (1, para no malgastar).
    #
    # El ritmo 2-2-2 de las supervisoras (250) pesa MÁS que el hueco de cobertura
    # de supervisora (120): así, cuando una está de vacaciones, la otra mantiene
    # su 2-2-2 (libra 2 de cada 6) y los días que no puede cubrir se reportan en
    # 'supervisor_warnings' para que la administradora los rellene a mano, en vez
    # de forzarla a trabajar todo el bloque seguido rompiendo el patrón.
    model.Minimize(
        1000 * sum(deficit_terms)
        + 300 * sum(streak_slacks)
        + 250 * sum(sup_pattern_slacks)  # ritmo 2M-2T-2D de supervisoras (prioritario)
        + 200 * sum(rest_run_slacks)
        + 120 * sum(sup_cover_slacks)    # tener una supervisora cubriendo (cede ante el patrón)
        + 15 * night_balance
        - 5 * sum(all_blocks)
        + 1 * sum(surplus_terms)
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = cfg.get("time_limit_seconds", 30)
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status == cp_model.INFEASIBLE:
        return "INFEASIBLE"
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None  # sin solución dentro del tiempo

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

    # --- Reparto de plantas (0/1/2) sobre el cuadrante resuelto ---
    floors = assign_floors(assignments, workers, days)
    roles = {w["id"]: w["role"] for w in workers}

    # --- Reportar días sin ninguna supervisora cubriendo (para ajustar a mano) ---
    supervisor_warnings = []
    sup_ids = [w["id"] for w in workers if w["role"] == "supervisora"]
    if sup_ids:
        for d in range(days):
            if not any(assignments[sid][d] in ("M", "T") for sid in sup_ids):
                supervisor_warnings.append({"day": d + 1})

    return {
        "ok": True,
        "status": solver.StatusName(status),
        "year": year, "month": month, "days": days,
        "start_date": cfg.get("start_date"),
        "dates": dates,
        "rest_warnings": rest_warnings,
        "supervisor_warnings": supervisor_warnings,
        "weekdays": [WEEKDAY_LETTERS[wd] for wd in weekdays],
        "assignments": assignments,
        "floors": floors,
        "roles": roles,
        "violations": violations,
        "objective": solver.ObjectiveValue(),
        "coverage_guaranteed": hard_coverage,
    }


def solve(cfg):
    """Resuelve garantizando la cobertura 9/9/2. Si un mes es imposible por
    falta de personal, reintenta permitiendo déficit y lo reporta en
    'violations' (en vez de devolver nada)."""
    want_hard = cfg.get("hard_coverage", True)
    res = _attempt(cfg, hard_coverage=want_hard)
    if want_hard and res == "INFEASIBLE":
        # Cobertura garantizada imposible: respaldo con déficit reportado.
        res = _attempt(cfg, hard_coverage=False)
        if isinstance(res, dict):
            res["coverage_relaxed"] = True
    if not isinstance(res, dict):
        return {"ok": False, "status": res or "UNKNOWN"}
    return res



# ---------------------------------------------------------------------------
# Manejador HTTP para Vercel (función serverless Python).
# ---------------------------------------------------------------------------
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            cfg = json.loads(raw or b"{}")
            cfg.setdefault("time_limit_seconds", 35)
            result = solve(cfg)
            code = 200 if result.get("ok") else 422
        except Exception as e:  # noqa: BLE001
            result = {"ok": False, "error": str(e)}
            code = 500
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok": true, "msg": "POST con la configuracion para generar."}')
