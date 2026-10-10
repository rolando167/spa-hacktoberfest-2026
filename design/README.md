# Diseño · Rutas por voz

Maquetas móviles (390 × 844) exportadas del lienzo de diseño. Son **referencia visual**: HTML estático con estilos en línea, no código de producción.

Lienzo original (privado): https://claude.ai/code/artifact/616f792b-523e-49a9-b158-583070fbd16b

| # | Pantalla | Archivo | Ruta en la app |
|---|---|---|---|
| 0 | Acceso (Google simulado, probar sin cuenta; la maqueta aún muestra Apple, Facebook y el correo, ya descartados) | `screens/00-acceso.*` | `/` |
| 1 | Inicio: mapa con ubicación, «Sugerir ruta» desactivado, barra para hablar | `screens/01-inicio.*` | `/inicio` |
| 2 | Grabando: temporizador, onda, transcripción, parar | `screens/02-grabando.*` | `/inicio` (estado) |
| 3 | Intención detectada: chips, radio a pie, «Sugerir ruta» activo | `screens/03-intencion.*` | `/inicio` (estado) |
| 4 | Ruta sugerida: mapa con trazado, cifras, resumen, POIs con foto | `screens/04-ruta-sugerida.*` | `/ruta` |
| 5 | En ruta: mapa a pantalla completa que sigue al punto azul, geovalla, progreso | `screens/05-en-ruta.*` | `/navegar` |
| 6 | Llegada a parada: parada resaltada, foto, descripción detallada, «Escuchar» | `screens/06-llegada.*` | `/navegar` (estado) |

Los `.html` se enlazan entre sí: abre `00-acceso.html` en el navegador y navega por el flujo.
Los mapas de las maquetas son dibujos; en la app son Leaflet + teselas de OpenStreetMap.

## Tokens

Definidos en `src/styles/tokens.css`.

| Token | Valor | Uso |
|---|---|---|
| `--ground` | `#EEF1EF` | fondo |
| `--ink` | `#12201C` | texto, paneles oscuros |
| `--muted` | `#4A5853` | texto secundario |
| `--accent` | `#0B5D45` | acción principal |
| `--accent-soft` | `#E3EEEA` | chips |
| `--route` | `#C2410C` | trazado y paradas |
| `--rec` | `#F97316` | grabación |
| `--user` | `#2563EB` | punto de ubicación |

Tipografías: **Bricolage Grotesque** (títulos, cifras) y **Figtree** (texto). Radios 10/16/24/28 px. Objetivos táctiles ≥ 44 px.
