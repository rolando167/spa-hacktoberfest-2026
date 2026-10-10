# Rutas por voz

SPA móvil en React. Le dices qué te apetece («llueve, algo bajo techo y corto»), detecta lo que buscas y te propone una ruta a pie con puntos de interés reales sobre un mapa Leaflet. Durante la ruta te sigue el punto azul y, al llegar a cada parada, te la cuenta en voz alta.

## Arrancar

```bash
npm install
cp .env.example .env
npm run dev
```

Abre la URL que muestra Vite desde el móvil, en la misma red. Con `VITE_USE_MOCKS=true` todo funciona sin claves: la ruta se simula alrededor de tu ubicación.

Para usar el backend real (Netlify Functions + ElevenLabs + LLM):

```bash
npm i -g netlify-cli
# rellena las claves en .env y pon VITE_USE_MOCKS=false
npm run dev:netlify   # http://localhost:8888
```

## Deploy (Netlify)

1. Conecta el repo en Netlify. `netlify.toml` ya define el build (`npm run build` → `dist`), las funciones y las redirecciones de la SPA.
2. En **Site configuration › Environment variables**, añade las variables de `.env.example`.

## Stack

React 18 · Vite 5 · TypeScript · react-leaflet · Netlify Functions · ElevenLabs (STT y TTS) · Anthropic (LLM) · OpenStreetMap/Overpass · OpenRouteService · Open-Meteo · Wikidata · Supabase Auth

- Contexto y tareas pendientes: [`CLAUDE.md`](CLAUDE.md).
- Diseño de referencia: [`design/`](design/README.md).
