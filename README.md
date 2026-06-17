# Cuadrantes · Residencia Alhendín (Teresa Montes) — Grupo Longea

Aplicación para montar los **cuadrantes y turnos** de una residencia de mayores.
Sustituye el Excel manual por un **generador automático** que cuadra el mes (o la
semana) respetando el convenio, y una **web** donde la administradora revisa,
ajusta y publica, y cada trabajadora consulta su turno.

> Estado: **en producción** (Vercel + Neon). Motor conectado a la web,
> generación por mes y por semana, edición manual, reglas configurables, gestión
> de plantilla y vacaciones, fichas con foto y avisos a las trabajadoras.

Este README está pensado para que **otra persona (o agente) pueda replicar** el
sistema entero: explica qué hace cada pieza y **cómo** está hecha.

---

## 1. Arquitectura general

```
engine/   Motor de generación (Python + Google OR-Tools / CP-SAT)
web/      App web (Next.js App Router + TypeScript + Tailwind)
          └─ web/api/generar.py  ← función serverless Python (se EXTRAE del motor)
```

- El **motor** (`engine/generate.py`) modela el cuadrante como un problema de
  asignación de turnos (*nurse rostering*) y lo resuelve con CP-SAT.
- La **web** (Next.js) corre en Vercel. Para generar, hace `POST` a
  `/api/generar`, que es una **función serverless de Python** desplegada por
  Vercel a partir de `web/api/generar.py`.
- `web/api/generar.py` **no se escribe a mano**: se **genera** a partir de
  `engine/generate.py` (ver §3). Así el motor vive en un solo sitio.

Flujo de generación:

```
Panel (server action) ──▶ buildGenerateConfig(tenant, año, mes)  [lee BD]
       │                        └─ produce el JSON de configuración del motor
       ▼
   POST /api/generar (Python CP-SAT)  ──▶ devuelve {assignments, violations, ...}
       │
       ▼
   saveCuadrante(tenant, año, mes, resultado)  [guarda en BD]
```

---

## 2. El motor (`engine/generate.py`)

```bash
cd engine
pip install -r requirements.txt          # ortools
python3 generate.py config.example.json -o output.json
```

### 2.1 Estados y calendario

Cada trabajadora tiene **un estado por día**: `M` (mañana), `T` (tarde),
`N` (noche), `D` (descanso) o `V` (vacaciones, fijado de antemano).

El calendario se construye de dos formas (función `_attempt`):
- **Mes completo**: `cfg.year` + `cfg.month` → `build_calendar`.
- **Rango / semana**: `cfg.start_date` (`YYYY-MM-DD`) + `cfg.num_days` →
  `build_calendar_range`. Devuelve además `dates` (lista ISO por día).

### 2.2 Reglas DURAS (siempre se cumplen)

- Un estado por persona y día; vacaciones fijadas.
- **Tras una noche**, al día siguiente no se hace mañana ni tarde (solo `N`/`D`).
- **Mínimo 12 h entre turnos** (`min_hours_between_shifts`, usando los horarios
  reales).
- **Máximo de días seguidos trabajando** (`max_consecutive_work_days`).
  ⚠️ **M.Mar (gerocultora_lv) y supervisoras quedan EXENTAS** de este máximo,
  porque tienen patrón propio (si no, bajar el máximo por debajo de 5 hacía el
  problema **infeasible**: M.Mar trabaja L–V = 5 días seguidos fijos).
- **M.Mar**: solo L–V en turno de mañana (fines de semana libres).
- **Supervisoras**: sin noches; patrón semanal 3 mañanas / 2 tardes / 2 descansos
  en semanas completas.

### 2.3 Reglas configurables (preferencias fuertes, SOFT)

Se penalizan en el objetivo pero **nunca dejan el problema sin solución** (la
lección aprendida: una regla dura mal calibrada devuelve `INFEASIBLE` y no
genera nada; mejor penalizar y avisar):

- **Cobertura** diaria `M/T/N` (por defecto 9/9/2). Holgura penalizada: si por
  números no se puede cubrir, se genera igual y se **reporta el déficit** en
  `violations`. Hay un primer intento con cobertura **dura** y, si es infeasible,
  se reintenta con cobertura blanda (`solve()` → `_attempt(hard_coverage)`).
- **Descanso tras racha** (`rest_after_streak: {threshold, min_rest}`): tras
  `threshold` días seguidos trabajando, si se descansa debe ser de al menos
  `min_rest` días seguidos (evita el "6 días y 1 solo descanso"). SOFT.
- **Máximo de descansos seguidos** (`max_consecutive_rest_days`): evita "3+
  descansos juntos". Las **vacaciones (V) no cuentan**. SOFT.
- **Domingos libres** (`sunday_off_per_month`): mínimo de domingos de descanso.
  En modo semana se pasa a 0.
- **Bloque de 36 h** (`rest_block_window_days`): 2 días seguidos de descanso cada
  N días. Con valor `0` se desactiva (modo semana).

### 2.4 Reglas BLANDAS (reparto justo)

- Equilibrio de noches entre gerocultoras (se minimiza la varianza).
- Se incentivan los bloques de 36 h.

### 2.5 Objetivo (pesos)

```
minimizar  1000·déficit_cobertura
         +  300·incumplimientos_descanso_tras_racha
         +  200·incumplimientos_max_descansos_seguidos
         +   15·desequilibrio_de_noches
         -    5·bloques_de_36h
         +    1·exceso_de_cobertura
```

### 2.6 Esquema del JSON de configuración

```jsonc
{
  "year": 2026, "month": 7,            // ó "start_date": "2026-07-06", "num_days": 7
  "coverage": { "M": 9, "T": 9, "N": 2 },
  "supervisors_count_in_coverage": true,
  "shift_hours": { "M": [7, 14.5], "T": [14.5, 22], "N": [22, 31] },
  "rules": {
    "max_consecutive_work_days": 4,
    "max_consecutive_rest_days": 2,
    "rest_after_streak": { "threshold": 4, "min_rest": 2 },
    "sunday_off_per_month": 1,
    "rest_block_window_days": 14,
    "no_morning_or_afternoon_after_night": true,
    "min_hours_between_shifts": 12
  },
  "time_limit_seconds": 35,
  "workers": [
    { "id": "uuid", "name": "Bárbara", "role": "gerocultora",
      "vacations": [1,2,3], "no_night": true, "only_shift": "T" }
  ]
}
```

`role` ∈ `gerocultora` | `gerocultora_lv` (M.Mar, solo L–V mañana) | `supervisora`.
`vacations` son índices de día **1-based dentro del rango** (mes o semana).

---

## 3. Cómo se genera la función serverless `web/api/generar.py`

Vercel despliega cualquier `.py` bajo `web/api/` como función serverless. La
función **no se edita a mano**: se obtiene tomando todo `engine/generate.py`
**hasta antes de `def main`** y añadiendo un handler HTTP. Cada vez que cambia el
motor hay que **re-extraerla**:

```bash
MAIN_LINE=$(grep -n "^def main" engine/generate.py | head -1 | cut -d: -f1)
head -n $((MAIN_LINE-1)) engine/generate.py > web/api/generar.py
cat >> web/api/generar.py <<'PY'

from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", 0))
            cfg = json.loads(self.rfile.read(length) if length else b"{}")
            cfg.setdefault("time_limit_seconds", 35)
            result = solve(cfg)
            code = 200 if result.get("ok") else 422
        except Exception as e:
            result = {"ok": False, "error": str(e)}; code = 500
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json"); self.end_headers()
        self.wfile.write(b'{"ok": true}')
PY
python3 -c "import ast; ast.parse(open('web/api/generar.py').read())"   # verifica sintaxis
```

`web/vercel.json` fija `functions["api/generar.py"].maxDuration = 60`. El motor
usa `time_limit_seconds = 35` para entrar holgado bajo ese tope (cuidado: subirlo
acerca el tiempo de pared a 60 s).

---

## 4. La web (`web/`)

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

Next.js App Router. **Importante**: la versión de Next del repo tiene cambios
respecto a lo habitual (ver `web/AGENTS.md`); `params`/`searchParams` de las
páginas son **Promesas** (`await`). Server actions con `bodySizeLimit: "8mb"`
en `next.config.ts` (para subir fotos).

### 4.1 Panel de administración (rol `admin`)

| Ruta | Qué hace |
|---|---|
| `/panel` | Generar **mes** (con estado "Generando…"), ver el cuadrante, **Publicar y avisar**, **Editar**, **Descargar Excel/PDF**, **Importar** JSON. Muestra las **reglas activas**. |
| `/panel/editar` | Edición manual del mes: tocar una celda rota `M→T→N→D→V`; guarda. |
| `/panel/config` | **Reglas de generación** configurables (cobertura, máx. días/descansos seguidos, descanso tras racha, domingos, si las supervisoras cuentan). |
| `/panel/semana` | Generar y ver **por semanas** (elige el lunes). Mismas reglas. Descargar PDF/Excel, imprimir, selector de semanas. |
| `/panel/semana/editar` | Edición manual de la semana. |
| `/panel/plantilla` | Gestión de plantilla: **añadir / editar / dar de baja / reactivar / eliminar**. Miniaturas de foto. |
| `/panel/plantilla/[id]` | **Ficha** de la trabajadora (estética "tarjeta de personal" vintage): datos y preferencias, **subir foto**, **vacaciones** (añadir/quitar), hoja de servicio. |
| `/panel/vacaciones` | **Calendario de vacaciones** del equipo (rejilla mensual navegable; fila de solapes en ámbar si 3+). |
| `/panel/accesos` | Asignar correo/móvil y código de acceso a cada trabajadora; restablecer PIN. |
| `/api/export` | Excel (ExcelJS). `?year&month` para el mes, `?week=YYYY-MM-DD` para la semana. |

Detalles de implementación clave:
- **El panel muestra el cuadrante recién generado**: `getLatestCuadrante` ordena
  por `updatedAt` (no por año/mes), para no mostrar siempre el mes mayor.
- **Publicar y avisar** (`notifyNewCuadrante`): avisa a las trabajadoras activas
  con acceso. **Email** (Resend) si tienen correo; si no, **SMS** (LabsMobile).
  Es manual (botón), para no spamear al regenerar.
- **Generación robusta**: si las reglas son imposibles, el motor devuelve
  `INFEASIBLE` y el panel muestra "relaja las reglas" en vez de un error genérico.

### 4.2 Panel de la trabajadora (rol `worker`)

| Ruta | Qué hace |
|---|---|
| `/mi-turno` | Tarjeta **Hoy/Mañana**, próximos turnos, resumen del mes, calendario, leyenda. **Selector de meses** y **Descargar mi mes (PDF)**. |
| `/mi-ficha` | Su propia **ficha** vintage (solo lectura) con datos, vacaciones y hoja de servicio. Puede **subir/quitar su propia foto** (la acción usa el `workerId` de la sesión: solo la suya). |

### 4.3 PDF / Excel

- **PDF**: cliente con `jspdf` + `jspdf-autotable` (`DownloadPdfButton` mes,
  `DownloadWeekPdfButton` semana, `DownloadMyMonthButton` turno personal).
- **Excel**: servidor con `exceljs` en `/api/export`.

---

## 5. Modelo de datos (Neon Postgres + Drizzle ORM)

Tablas (`web/src/db/schema.ts`): `tenants`, `workers`, `users`, `magic_tokens`,
`otp_codes`, `vacations`, `cuadrantes`, `settings`.

- `workers`: `tenantId, name, jobRole, phone, noNight, onlyShift, active`.
- `cuadrantes`: `tenantId, year, month, data (jsonb), updatedAt` (único por
  tenant+año+mes). `data` es el JSON del motor + `names`.
- `vacations`: `workerId, startDate, endDate, note`.

### 5.1 La tabla `settings` como almacén sin migración

Patrón usado para **evitar migraciones** cada vez que añadimos algo. Clave por
tenant (`primaryKey(tenantId, key)`), valor texto/JSON:

| Clave | Contenido | Lib |
|---|---|---|
| `gen_config` | Reglas de generación (JSON) | `lib/gen-settings.ts` |
| `week:<YYYY-MM-DD>` | Cuadrante semanal (JSON) | `lib/week-cuadrantes.ts` |
| `photo:<workerId>` | URL de la foto en Blob | `lib/photos.ts` |
| `worker_access_code` | Código de acceso de la residencia | `lib/worker-access.ts` |

> Regla práctica: si no había `DATABASE_URL` para migrar cómodamente, se guardó
> en `settings`. Datos "de primera clase" (plantilla, vacaciones, cuadrantes
> mensuales) sí son tablas; el resto va en `settings`.

---

## 6. Autenticación e integraciones

- **Login magic link (correo)**: token de un solo uso, hasheado, caduca 15 min.
  Sesión = JWT firmado (`jose`) en cookie `httpOnly`.
- **Login por SMS**: OTP de 6 dígitos vía **LabsMobile** (`lib/sms.ts`, tabla
  `otp_codes`). Sin proveedor configurado, en desarrollo el código se imprime en
  consola.
- **Roles**: `superadmin`, `admin` (Diana), `worker`. `ADMIN_EMAILS` /
  `ADMIN_PHONES` entran como admin; `SUPERADMIN_EMAILS` como superadmin.
- **Multi-residencia (tenants)**: `getCurrentTenant()` resuelve por host
  (subdominio) con `alhendin` por defecto. Todo se filtra por `tenantId`.
- **Email**: Resend (`lib/email.ts`). **SMS**: LabsMobile (`lib/sms.ts`).
  **Fotos**: Vercel Blob (`@vercel/blob`, `put(... access:"public")`).

---

## 7. Variables de entorno (`web/.env.example`)

```
DATABASE_URL=                 # Neon Postgres
AUTH_SECRET=                  # openssl rand -base64 32
APP_URL=                      # https://planturnos.com
RESEND_API_KEY=  EMAIL_FROM=  CONTACT_EMAIL=
ADMIN_EMAILS=  SUPERADMIN_EMAILS=  ADMIN_PHONES=
LABSMOBILE_USERNAME=  LABSMOBILE_TOKEN=  SMS_SENDER=
BLOB_READ_WRITE_TOKEN=        # lo añade Vercel al conectar un store de Blob
```

Puesta en marcha:

```bash
cd web
cp .env.example .env       # rellena las variables
npm install
npm run db:push            # crea las tablas en Neon
npm run db:seed            # plantilla inicial (revisar nombres)
npm run dev
```

---

## 8. Despliegue (Vercel)

- Proyecto Vercel apunta a `web/`. Build de Next.js + función Python
  `api/generar.py` (runtime Python detectado por Vercel).
- `web/vercel.json`: `framework: nextjs` y `functions["api/generar.py"].maxDuration = 60`.
- **Flujo de trabajo**: se desarrolla en rama, se abre PR (Vercel hace **Preview**)
  y al fusionar a `main` se despliega **Producción**. Para tener solo
  `1 preview + 1 producción` por cambio, no se hace el merge-sync extra de la
  rama. (Para 1 solo deploy: desactivar previews con un *Ignored Build Step*
  `bash -c "[ \"$VERCEL_ENV\" != production ]"`.)

---

## 9. Reglas y decisiones confirmadas con Diana (producto)

- ✅ **Cobertura** 9 mañana / 9 tarde / 2 noche. Las **supervisoras SÍ cuentan**.
- ✅ **Horarios**: mañana 7:00–14:30 · tarde 14:30–22:00 · noche 22:00–7:00.
- ✅ **Supervisoras**: 3M/2T/2D semanal, sin noches.
- ✅ **M.Mar**: solo L–V de mañana.
- ✅ **Queja resuelta** "muchos días y 1 solo descanso" → regla *descanso tras
  racha* (p. ej. tras 4 días → 2 descansos) + *máximo de descansos seguidos* (2).
- ✅ **Sin noches / turno fijo / vacaciones**: configurables por trabajadora
  desde la ficha (ya no se tocan en el código).
- ✅ Defaults en `lib/gen-settings.ts`: cobertura 9/9/2, máx. 6 trabajo, máx. 2
  descansos, tras 5 → 2 descansos, 1 domingo libre (Diana los ajusta en
  `/panel/config`).

---

## 10. Leyenda de turnos

| Código | Significado |
|---|---|
| M | Mañana (7:00–14:30) |
| T | Tarde (14:30–22:00) |
| N | Noche (22:00–7:00) |
| D | Descanso |
| V | Vacaciones |

---

## 11. Pasos para replicar desde cero (resumen)

1. **Motor**: `engine/generate.py` con CP-SAT y el esquema de §2.6.
2. **Función**: extraer `web/api/generar.py` con el script de §3.
3. **Web Next.js** en `web/`, Tailwind, Drizzle + Neon, auth magic-link/OTP.
4. **BD**: tablas de §5 (`db:push`), más la tabla `settings` para lo demás.
5. **Integraciones**: Resend, LabsMobile, Vercel Blob (envs de §7).
6. **Pantallas**: panel admin (§4.1) y trabajadora (§4.2).
7. **Desplegar** en Vercel con `vercel.json` (§8).
8. **Configurar** reglas y plantilla desde el panel; generar; publicar y avisar.
