# Cuadrantes · Residencia Alhendín (Teresa Montes) — Grupo Longea

Aplicación para montar los **cuadrantes y turnos** de la residencia de mayores
de Alhendín (Granada). Sustituye el Excel actual por:

1. Un **generador automático** que cuadra el mes respetando el convenio.
2. Una **web** donde la supervisora revisa/ajusta el cuadrante y cada
   trabajadora consulta su turno.

> Estado: **prototipo funcional**. El motor ya genera un mes válido y la web ya
> muestra el cuadrante. Faltan login, edición manual y afinar reglas del
> convenio (ver _Preguntas abiertas_).

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
es conectarla al motor y añadir login.)

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

## Preguntas abiertas (pendientes de confirmar con Diana)

1. **Plantilla exacta**: la lista real es 26 gerocultoras + 2 supervisoras. La
   config de ejemplo lleva nombres leídos de la foto (hay que repasarlos) y una
   "sustituta" para la plaza que deja Diana. ¿Ana Muñoz sigue como gerocultora
   o causa baja?
2. **¿Las supervisoras cuentan dentro de las 9 de cada turno, o van aparte?**
   (ahora mismo: aparte).
3. **Patrón exacto de las supervisoras**: "2 mañanas, 2 tardes, 2 descansos"
   ¿es por semana? ¿qué pasa con el 7º día?
4. **Horarios reales** de cada turno (mañana/tarde/noche) para calcular bien las
   36 h de descanso. (asumido: M 8–15, T 15–22, N 22–8).
5. **Descanso semanal**: ¿36 h se garantizan cada semana o se promedian en 14
   días? ¿Máximo de días seguidos trabajando según convenio?
6. **¿Los subtipos M1–M4 necesitan un mínimo por día** (p. ej. siempre alguien
   en cada grupo de ducha) o basta con sumar 9 de mañana?
7. **Vacaciones**: ¿las fija la supervisora y el motor las respeta, o el motor
   también las reparte?
