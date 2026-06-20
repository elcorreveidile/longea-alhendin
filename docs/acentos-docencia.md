# Acentos · Reparto de docencia (CLM Granada) — notas de dominio

> Documento de trabajo. Recoge cómo la subdirección asigna la docencia, para
> diseñar el futuro motor de reparto (Fase 2). Pendiente de confirmar/ampliar.

## Proceso de asignación (subdirección)

1. **Asignaturas de contenido primero.** Hay asignaturas que dan, año tras año,
   determinados profesores (asignación recurrente y estable). Se fijan antes que
   nada.
2. **Después, cuadrar los cursos en el calendario.** La parte más compleja:
   encajar **cursos de un mes** con **cursos de 15 días** sin solapes y respetando
   horas/disponibilidad de cada profesor.

## Catálogo de cursos

- **Intensivos.** Todos los meses del año **excepto agosto** (centro cerrado,
  profesorado de vacaciones). En septiembre, "intensivos de septiembre".
- **Estudios Hispánicos** (Estudios de Lengua y Cultura Española). Periodos:
  **octubre–diciembre** y **febrero–mayo**.
  - *Estudios Hispánicos*: requiere **mínimo B2**.
  - *Estudios de Lengua y Cultura Española*: la diferencia es que **no** exige B2.
  - Hay variante **impartida en inglés** (el profesor debe poder dar clase en
    inglés → el idioma de impartición importa).
- **Cursos de diseño especial** (a medida).
- **Cursos de formación**, **Máster**, etc.

## Calendario (resumen)

| Periodo            | Qué hay                                             |
|--------------------|-----------------------------------------------------|
| Todo el año (–ago) | Intensivos mensuales                                |
| Oct–Dic            | Intensivos + Estudios Hispánicos / Lengua y Cultura |
| Ene                | Intensivos                                          |
| Feb–May            | Intensivos + Estudios Hispánicos / Lengua y Cultura |
| Jun–Jul            | Intensivos                                          |
| **Agosto**         | **Cerrado**                                         |
| Sep                | Intensivos de septiembre                            |

## Implicaciones de modelo (borrador, a confirmar)

- **Curso** = { tipo (intensivo / hispánicos / lengua-cultura / diseño especial /
  formación / máster…), programa, **nivel/requisito** (p. ej. B2 mínimo),
  **idioma de impartición** (español / inglés), **fechas** (mes completo o 15
  días), **franja** (mañana/tarde), horas que computa al profesor }.
- **Profesor** (además de lo que ya hay: objetivo, reducción, disponibilidad
  mañana/tarde, vacaciones): **asignaturas de contenido** que imparte cada año,
  **idiomas** (¿puede dar en inglés?), nivel que puede impartir.
- **Reglas duras**: no estar en dos cursos solapados a la vez; respetar
  disponibilidad e idioma; cumplir el requisito de nivel del curso.
- **Objetivo blando**: acercar las horas asignadas al objetivo anual de cada
  profesor; respetar las asignaciones recurrentes de contenido.
- **El puzzle**: encajar 1 mes vs 2×15 días en el mismo hueco/franja (un curso de
  mes ↔ dos quincenas encadenadas) sin chocar con la disponibilidad ni las horas.

## Preguntas abiertas (para cuando construyamos)

1. ¿Los cursos tienen **horario concreto** (p. ej. L–V 9:00–11:00) o basta con
   "mañana/tarde"? (Para detectar solapes hace falta saberlo.)
2. ¿Los **intensivos** son siempre de una duración fija (¿quincena? ¿mes?)?
3. ¿Las **asignaturas de contenido** van ligadas a un profesor fijo o a una lista
   de candidatos posibles?
4. ¿De dónde saldrán los datos de cursos de cada periodo (los carga la
   subdirección a mano, se importan…)?
5. Niveles posibles (A1…C2) y qué cursos exigen qué nivel.
