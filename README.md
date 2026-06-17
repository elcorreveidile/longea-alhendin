# Cuadrantes · Residencia Alhendín (Teresa Montes) — Grupo Longea

Aplicación para montar los **cuadrantes y turnos** de la residencia de mayores
de Alhendín (Granada). Sustituye el Excel actual por:

1. Un **generador automático** que cuadra el mes respetando el convenio.
2. Una **web** donde la supervisora revisa/ajusta el cuadrante y cada
   trabajadora consulta su turno.

> Estado: **prototipo funcional**. El motor genera un mes válido, la web muestra
> el cuadrante y ya hay **login por magic link** (Neon + Resend) con roles
> (administradora / trabajadora). Faltan: conectar el motor a la web, edición
> manual y afinar reglas del convenio (ver _Preguntas abiertas_).

## Estructura

```
engine/   Motor de generación (Python + Google OR-Tools / CP-SAT)
web/      App web (Next.js + TypeScript + Tailwind)
```

## El motor (`engine/`)

Modela el cuadrante como un problema de asignación de turnos (*nurse rostering*)
y lo resuelve con CP-SAT.

```bash
cd engine
pip install -r requirements.txt
python3 generate.py config.example.json -o output.json
```

**Reglas duras** (se cumplen siempre): un estado por persona y día; cobertura
9 mañana / 9 tarde / 2 noche; descanso tras la noche; máx. días seguidos
trabajando; bloque de 36 h de descanso; un domingo libre al mes; M.Mar solo
L–V de mañana; supervisoras sin noches con patrón 2M/2T.

**Reglas blandas** (se reparten con justicia): equilibrio de noches entre
gerocultoras. La cobertura usa holgura penalizada: si por números no se puede
cubrir un turno, se genera igualmente y se **reporta el déficit**.

## La web (`web/`)

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

Muestra el cuadrante generado con colores por turno y una fila que comprueba la
cobertura en vivo. (De momento carga un cuadrante de muestra; el siguiente paso
es conectarla al motor.)

### Autenticación y base de datos

- **Login por magic link**: la usuaria introduce su correo y recibe un enlace de
  acceso (sin contraseña). Token de un solo uso, hasheado en BD, caduca en 15
  min. La sesión es un JWT firmado (`jose`) en cookie `httpOnly`.
- **Roles**: `admin` (Diana: monta cuadrantes y gestiona plantilla) y `worker`
  (cada trabajadora ve su turno). El correo que figure en `ADMIN_EMAILS` entra
  automáticamente como admin la primera vez.
- **Base de datos**: Neon (Postgres) con Drizzle ORM. Tablas: `workers`,
  `users`, `magic_tokens`, `vacations`, `cuadrantes`.
- **Correo**: Resend.

#### Puesta en marcha (web)

```bash
cd web
cp .env.example .env        # rellena DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, ADMIN_EMAILS
npm install
npm run db:push             # crea las tablas en Neon
npm run db:seed             # carga la plantilla inicial (revisar nombres)
npm run dev
```

Variables de entorno (ver `web/.env.example`): `DATABASE_URL`, `AUTH_SECRET`
(`openssl rand -base64 32`), `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`
(aquí el correo de Diana), `APP_URL`.

> ⚠️ La autenticación es a medida (magic link). Antes de producción conviene una
> **revisión de seguridad** y añadir **rate-limiting** al envío de enlaces.

## Leyenda de turnos (según la plantilla actual)

| Código | Significado |
|---|---|
| M, M1–M4 | Mañana (el número = grupo de residentes para la ducha) |
| T | Tarde |
| N | Noche |
| D | Descanso |
| V | Vacaciones |
| H / HD | Horas debidas / horas devueltas (banco de horas, no es un turno) |

## Plan por fases

- **Fase 1 — Motor + visualización** ✅ (este prototipo)
- **Fase 2 — App completa**: login (supervisora vs. trabajadora), edición manual
  con validación en vivo, gestión de vacaciones y banco de horas, exportar a
  PDF/imprimir.
- **Fase 3 — Despliegue** para la residencia y formación.

## Reglas confirmadas por Diana

- ✅ **Las supervisoras SÍ cuentan** dentro de los 9 de cada turno.
- ✅ **Patrón de supervisora**: 3 mañanas / 2 tardes / 2 descansos por semana
  (2M+2T+2D y el 7º día entra de mañana), sin noches.
- ✅ **Horarios**: mañana 7:00–14:30 · tarde 14:30–22:00 · noche 22:00–7:00.
- ✅ **Sin noches**: Rocío, Mar, Diego, Noemí.
- ✅ **Noemí**: solo tardes (si no se va).
- ✅ **Vacaciones julio**: Cloe 1–15, Diana 1–15, Mar 16–30, Isabel 16–30,
  Toñi 16–30. _(Agosto: Azblais 1–15, Ana Montoro 1–15, Mónica 16–30.)_

## Preguntas abiertas (pendientes de confirmar con Diana)

1. **Plantilla exacta**: la lista real es 26 gerocultoras + 2 supervisoras. La
   config de ejemplo lleva nombres leídos de la foto (hay que repasarlos) y una
   "sustituta" para la plaza que deja Diana. ¿Ana Muñoz sigue como gerocultora
   o causa baja?
2. **Nota cortada**: en el papel pone "2 personas solo hacen turno de…" (no se
   ve el final). ¿Qué turno hacen en exclusiva esas 2 personas? ¿Quiénes son?
3. **Descanso semanal**: ¿36 h se garantizan cada semana o se promedian en 14
   días? ¿Máximo de días seguidos trabajando según convenio?
4. **¿Los subtipos M1–M4 necesitan un mínimo por día** (p. ej. siempre alguien
   en cada grupo de ducha) o basta con sumar 9 de mañana?
