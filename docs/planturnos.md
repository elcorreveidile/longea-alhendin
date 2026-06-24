# PlanTurnos — visión general del producto (orientación para un agente)

> **Qué es esto.** Este documento explica, de arriba abajo, **qué es
> `planturnos.com`** y cómo está montado, para que cualquier persona o **agente**
> que llegue al repositorio entienda el conjunto antes de tocar nada. Para el
> detalle del **motor de cuadrantes** ver [`/README.md`](../README.md); para el
> dominio de la **academia** ver [`docs/acentos-docencia.md`](acentos-docencia.md);
> para las peculiaridades del **Next.js** del repo ver [`web/AGENTS.md`](../web/AGENTS.md).

Estado: **en producción** (Vercel + Neon Postgres). Versión visible: la que marque
`web/src/lib/version.ts` (`APP_VERSION`, hoy `v1.2`), que se pinta en el pie de
todas las webs.

---

## 1. Qué es PlanTurnos

**PlanTurnos** es un **SaaS multi-empresa** (multi-tenant) para **organizar el
trabajo de equipos**. Nació para los **cuadrantes de turnos** de una residencia
(Alhendín) y ha crecido hasta ser una plataforma con **varias empresas** dentro
del mismo despliegue, e incluso un **segundo tipo de cliente** (academias de
idiomas) con su propia gestión y su propia web pública.

Una sola base de código sirve **tres caras**:

1. **Web comercial** — `planturnos.com` (dominio raíz). Marketing del producto:
   landing, sectores, precios, **blog**, demo, contacto. Pública.
2. **Apps de empresa** — `<empresa>.planturnos.com` (subdominios). El panel
   privado de cada cliente. Hay **dos tipos** de empresa (ver §3):
   - **Residencias / sectores a turnos** → cuadrantes y turnos.
   - **Academias** (p. ej. Acentos) → reparto de docencia y control de horas.
3. **Webs públicas de empresa** — algunas empresas tienen además su **web pública
   propia** servida en su subdominio. Hoy: **Acentos del español** en
   `acentos.planturnos.com` (web multipágina bilingüe ES/EN; ver §6).

---

## 2. Arquitectura y stack

```
engine/   Motor de generación de cuadrantes (Python + Google OR-Tools / CP-SAT)
web/      App web (Next.js App Router + TypeScript + Tailwind)
          ├─ src/app/        páginas y server actions (App Router)
          ├─ src/lib/        sesión, tenant, generación-config, versión…
          ├─ src/db/         Drizzle ORM (schema, queries) sobre Neon Postgres
          ├─ src/data/       contenido (blog, sectores, datos semilla de Acentos…)
          ├─ src/components/  UI compartida (TopBar, Cuadrante, footers…)
          ├─ public/         estáticos (logos, imágenes, /academia/*, /img/*)
          └─ api/generar.py  función serverless Python (se EXTRAE del motor)
docs/     Notas de dominio (academia, este overview)
```

- **Frontend/back**: **Next.js App Router** (versión con cambios respecto a lo
  habitual: `params`/`searchParams` son **Promesas**, hay que `await` — lee
  `web/AGENTS.md` **antes** de escribir código).
- **Base de datos**: **Neon Postgres** vía **Drizzle ORM** (`src/db/schema.ts`).
- **Motor**: **Python CP-SAT** (`engine/generate.py`), desplegado como función
  serverless en `web/api/generar.py` (que **no se edita a mano**: se re-extrae del
  motor — ver README §3).
- **Hosting**: **Vercel** (proyecto `longea-alhendin`). Deploy de producción al
  hacer push a `main`. Imágenes de logos subidas a **Vercel Blob**.
- **Sesión**: cookie JWT (`src/lib/session.ts`).

> ⚠️ El proyecto de Vercel y el repo se llaman **`longea-alhendin`** por motivos
> históricos (nació con Longea/Alhendín). **No** es solo Alhendín: es todo
> PlanTurnos. Alhendín es una empresa (tenant) más.

---

## 3. Multi-empresa (multi-tenant)

- Cada empresa es una fila en la tabla **`tenants`** (`src/db/schema.ts`), con un
  **`slug`** que es su **subdominio** (`alhendin`, `acentos`…).
- El tenant activo se resuelve en **`src/lib/tenant.ts`**:
  - `slugFromHost(host)` saca el slug del subdominio.
  - `getCurrentTenant()` devuelve la empresa por la sesión (admin/trabajadora) o,
    si no, por el subdominio. El **superadmin** no pertenece a ninguna y se
    resuelve siempre por el subdominio (puede abrir el panel de cualquiera).
  - Logo por defecto por empresa: `defaultLogoFor(slug)` (p. ej. Acentos).
- **Tipo de empresa** (`src/lib/tenant-kind.ts`): cada tenant es de un **kind**
  (residencia vs academia). Las páginas se protegen con
  `requireResidencePanel()` / `requireAcademiaPanel()` según corresponda.

### Roles (`src/lib/session.ts`, `AppRole`)

| Rol | Quién | Entra a | Puede |
|-----|-------|---------|-------|
| `superadmin` | Dueño del producto | `/admin` | Todo, en cualquier empresa. Herramientas de bootstrap (semillas/importar). |
| `admin` | Administradora del centro | `/panel` | Gestiona su empresa: generar cuadrante, plantilla, vacaciones, docencia… |
| `worker` | Trabajadora / profesor | `/mi-turno` | Ver su turno/ficha/horas. |

`isStaffAdmin = admin || superadmin`. `homeForRole` decide a dónde va cada uno.

---

## 4. Enrutado por dominio

En `web/src/app/page.tsx` (la raíz):

```
hay sesión           → zona del rol (homeForRole)
subdominio = acentos → /academia        (su web pública)
otro subdominio      → /login            (acceso de la empresa)
dominio raíz         → <Landing/>        (web comercial PlanTurnos)
```

- `planturnos.com` → marketing (`Landing`, `/sectores`, `/precios`, `/blog`,
  `/demo`, `/contacto`…).
- `<empresa>.planturnos.com` → `/login` y, tras entrar, `/panel` (admin) o
  `/mi-turno` (trabajadora). El **favicon** y el **logo** se adaptan por host.
- `acentos.planturnos.com` → su **web pública** (`/academia`); el acceso del
  personal sigue en `/login`.

---

## 5. Cara "residencia / turnos" (el núcleo original)

Resuelve el **cuadrante mensual** (o semanal) de un equipo a turnos
(`M` mañana / `T` tarde / `N` noche / `D` descanso / `V` vacaciones).

- **Generar**: `/panel` → server action → `buildGenerateConfig(tenant, año, mes)`
  (`src/lib/generate-config.ts`, lee BD) → `POST /api/generar` (CP-SAT) →
  `saveCuadrante(...)`. Reglas (máx. días seguidos, descansos, cobertura,
  domingos, 2-2-2 de supervisoras…) en el motor; ver README §2.
- **Continuidad entre meses**: al generar un mes se pasa la **cola** (`prev_tail`,
  últimos ~6 días del mes anterior guardado) para que el nuevo mes **no rompa**
  la racha de días seguidos ni el descanso tras noche.
- **Datos**: `cuadrantes` (tenant, año, mes, `status`, `data` JSON con
  `assignments`/`floors`/…). `src/db/cuadrantes.ts`.
- **Pantallas**: `/panel` (generar y ver), `/panel/editar` y `/panel/semana`
  (editar), `/panel/plantilla` (trabajadoras y roles), `/panel/vacaciones`,
  `/panel/config` (reglas), `/panel/importar` (semillas e importación — **solo
  superadmin**), `/admin` (lista de empresas, superadmin). Trabajadora:
  `/mi-turno`, `/mi-ficha`, `/mis-horas`, `/acceso`.

---

## 6. Cara "academia" (Acentos del español)

Segundo tipo de cliente. Dos partes:

- **Gestión interna** (panel, para el centro): reparto de **docencia**
  (`/panel/docencia` → grupos, asignaturas, programas/ediciones), **control de
  horas** del profesorado (`/panel/horas`), **roles del centro** (`/panel/roles`),
  **accesos** y **correos** al profesorado. Modelo de dominio en
  [`docs/acentos-docencia.md`](acentos-docencia.md).
- **Web pública** (`src/app/academia/`): sitio **multipágina y bilingüe (ES/EN)**
  servido en `acentos.planturnos.com` — Inicio, Cursos, Áreas de estudio (las ~44
  asignaturas reales), Prácticas, La academia, Contacto. Identidad propia (logo
  "á", favicon, fondos por página). El selector de idioma usa cookie.

---

## 7. Cosas que conviene saber antes de tocar

- **Lee `web/AGENTS.md`**: el Next.js del repo tiene cambios (APIs/Promesas).
- **El motor vive en `engine/generate.py`**; `web/api/generar.py` se **re-extrae**
  (README §3). No editar el `.py` de `web/api` a mano.
- **Reglas del motor**: las duras mal calibradas devuelven `INFEASIBLE` y no
  generan nada. Preferir **reglas blandas penalizadas** que generan igual y
  **avisan** del déficit (filosofía del proyecto).
- **Producción = push a `main`**. Verificar en Vercel (proyecto `longea-alhendin`)
  que el deploy queda `READY`.
- **Datos reales (cuadrantes, vacaciones)**: se guardan **a nivel de empresa** y
  el guardado se hace **desde la app desplegada** (la BD de producción no es
  accesible desde el entorno de desarrollo del agente).
- **Versión**: fuente única en `web/src/lib/version.ts`.

---

## 8. Mapa rápido "quiero tocar X → mira aquí"

| Quiero… | Archivo / carpeta |
|--------|-------------------|
| Entender el motor / reglas | `engine/generate.py`, `README.md` |
| Config que se envía al motor | `web/src/lib/generate-config.ts` |
| Multi-tenant / subdominios | `web/src/lib/tenant.ts`, `tenant-kind.ts` |
| Sesión y roles | `web/src/lib/session.ts` |
| Enrutado por dominio | `web/src/app/page.tsx` |
| Guardar/leer cuadrantes | `web/src/db/cuadrantes.ts`, `db/schema.ts` |
| Panel de la residencia | `web/src/app/panel/*` |
| Academia (panel) | `web/src/app/panel/docencia/*`, `panel/horas/*` |
| Academia (web pública) | `web/src/app/academia/*` |
| Marketing / blog | `web/src/app/(landing y blog)`, `web/src/data/blog.ts` |
| Versión visible | `web/src/lib/version.ts` |
