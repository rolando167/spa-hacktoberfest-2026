# CLAUDE.md · Rutas por voz

SPA **solo móvil** que sugiere rutas a pie a partir de lo que el usuario dice en voz alta.
Ejemplo: «Está lloviendo, quiero algo bajo techo y que no sea más de quince minutos».

## Decisiones cerradas (no cambiar sin preguntar)

- **Front:** React 18 + Vite 5 + TypeScript. Router: `react-router-dom` v6.
- **Mapas:** Leaflet con `react-leaflet` v4 y teselas de OpenStreetMap.
- **Deploy:** Netlify. El backend son **Netlify Functions** en `netlify/functions/`. Nada de Cloudflare.
- **Voz:** ElevenLabs para todo el audio.
  - Voz → texto (Scribe) al grabar la petición.
  - Texto → voz para el botón «Escuchar» de cada punto de interés.
- **LLMs:** dos llamadas.
  1. Intención: transcripción → JSON (`Intent`).
  2. Ruta: elige y ordena paradas **entre candidatos reales** y escribe los textos.
- **Regla de oro:** el LLM **nunca** inventa lugares ni coordenadas. Los sitios vienen de OpenStreetMap (Overpass), el trazado de OpenRouteService y las fotos de Wikidata/Commons.
- **Auth:** simulada para la demo. «Continuar con Google» entra con un usuario de prueba guardado en `localStorage` (`src/lib/auth.ts`). Sin Supabase ni OAuth real.
- **Idioma de la UI:** español de España. Frases cortas, sin lenguaje de anuncio.

## Diseño

La referencia visual está en `design/` (lee `design/README.md`). Cada pantalla tiene su `.html` y su `.png`.
Al tocar la UI, compárala con el PNG correspondiente. Los tokens están en `src/styles/tokens.css`; no metas colores sueltos.

## Comandos

```bash
npm install
npm run dev          # solo front, con datos simulados (VITE_USE_MOCKS=true)
npm run dev:netlify  # front + funciones en http://localhost:8888 (requiere: npm i -g netlify-cli)
npm run build
npm run typecheck    # front + funciones
```

Para probar la navegación en el escritorio: en `/navegar`, con mocks activos, el botón «Simular llegada» lleva el punto azul a la siguiente parada.

## Estructura

```
src/
  screens/        Login · Home (inicio + grabando + intención) · RouteScreen · NavigateScreen (en ruta + llegada)
  components/     MapView (Leaflet), Header, IntentChips, PoiCard, icons
  hooks/          useGeolocation (watchPosition), useRecorder (MediaRecorder + onda), useWakeLock
  lib/            types.ts (contrato front↔back), api.ts, mocks.ts, geo.ts, auth.ts (login simulado)
  state/          AppState (intención y ruta, persistidas en sessionStorage)
  styles/         tokens.css, app.css
netlify/
  functions/      ← POR HACER: intent.mts, route.mts, tts.mts
  lib/            http.ts, elevenlabs.ts, llm.ts, sources.ts (Overpass, ORS, Open-Meteo, Wikidata)
design/           maquetas exportadas (html + png)
```

`src/lib/types.ts` es el contrato entre front y back. Las funciones lo importan directamente.

## API (Netlify Functions)

`/api/*` se redirige a `/.netlify/functions/*` (ver `netlify.toml`).

| Endpoint | Entrada | Salida | Pasos |
|---|---|---|---|
| `POST /api/intent` | multipart: `audio` (webm o mp4), `lat`, `lng` opcionales | `IntentResponse` | ElevenLabs STT → `currentWeather` → LLM (`INTENT_MODEL`) con la herramienta `guardar_intencion` |
| `POST /api/route` | JSON `RouteRequest` | `RouteSuggestion` | `findCandidates` (radio = la mitad de `maxMinutes` × 80 m, entre 400 m y 2 km) → LLM (`ROUTE_MODEL`) elige 2-4 ids → `walkingDirections` + `photoFor` |
| `POST /api/tts` | JSON `{ text }` | `audio/mpeg` | ElevenLabs TTS |

Las variables de entorno están en `.env.example`. Ninguna clave va en el front: solo las `VITE_*` llegan al navegador.

## Estado actual

**Hecho**
- Las 7 pantallas del diseño, navegables con datos simulados.
- Geolocalización real con seguimiento del punto azul.
- Grabación con MediaRecorder y onda en vivo.
- Geovalla de llegada: 30 m y 2 lecturas seguidas.
- Wake Lock y vibración al llegar.
- Librerías del backend: ElevenLabs, LLM y fuentes de datos.

**Pendiente (por orden)**
1. `netlify/functions/intent.mts`, `route.mts` y `tts.mts` usando `netlify/lib/*`, con el formato v2 de Netlify Functions (`export default async (req: Request) => Response`). Envuelve cada una con `handler()` de `http.ts`.
2. `src/lib/api.ts`: añadir `speak(text)`, que llame a `/api/tts`, cachee el blob por parada y lo reproduzca con `new Audio()`. Usarla en el botón «Escuchar» de `NavigateScreen`. Con mocks, recurrir a `speechSynthesis`.
3. Botón «Saltar parada» en el panel de llegada (está en el diseño y falta en el código).
4. Indicaciones giro a giro en la tarjeta superior de `/navegar` (ORS devuelve `steps`). Ahora solo muestra la distancia a la parada.
5. Arrastrar el mapa desactiva «Siguiéndote»; revisar también que el zoom con pellizco no lo desactive.
6. Pantalla de perfil (ahora el avatar muestra las iniciales del usuario de prueba y solo sirve para cerrar sesión).
7. Logos oficiales en los botones de acceso (los huecos discontinuos de 24 px en `Login.tsx`) y nombre definitivo de la app.
8. Deploy en Netlify: variables de entorno y dominio.

## Límites conocidos

- **Tiempo máximo de las funciones en Netlify:** las síncronas cortan a los 10 s por defecto. `/api/route` encadena Overpass, LLM, ORS y Wikidata, así que hay que medirlo.
  - Si se pasa, usa un modelo más rápido en `ROUTE_MODEL` y paraleliza todo lo posible.
  - Como alternativa, sube el límite en el plan de Netlify.
- **Geolocalización web:** solo funciona con la pantalla encendida y la pestaña visible. Exige HTTPS (en local, `localhost` vale).
- **Formato del audio:** iOS Safari graba mp4/aac y Chrome graba webm/opus. Comprueba que Scribe acepta los dos.
- **Overpass** es un servicio público con límites de uso. Envía un `user-agent` identificable (constante `UA` en `sources.ts`).

## Convenciones

- TypeScript estricto. Componentes funcionales y hooks.
- CSS plano con clases en `app.css` y tokens en `tokens.css`, sin librerías de UI.
- Accesibilidad:
  - Botones reales y `aria-label` en los botones que solo tienen icono.
  - Objetivos táctiles de al menos 44 px.
  - Contraste AA.
- Commits pequeños, uno por historia o issue.
