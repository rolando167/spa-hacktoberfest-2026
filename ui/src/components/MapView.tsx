import 'leaflet/dist/leaflet.css';
import L, { type Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng, RouteSuggestion } from '../lib/types';
import { LocateIcon } from './icons';

type Props = {
  position: LatLng;
  accuracy?: number | null;
  heading?: number | null;
  route?: RouteSuggestion | null;
  /** Índice de la parada hacia la que vas (navegación). Las anteriores se pintan como hechas. */
  nextStopIndex?: number;
  /** Índice de la parada en la que acabas de llegar: se resalta. */
  highlightStopIndex?: number | null;
  /** Radio de la geovalla de llegada, en metros. Se dibuja en la siguiente parada. */
  geofenceMeters?: number;
  /** Círculo de alcance a pie (pantalla de intención), en metros. */
  reachMeters?: number | null;
  /** El mapa se mantiene centrado en el usuario. */
  follow?: boolean;
  onUserPan?: () => void;
  onRecenter?: () => void;
  fitRoute?: boolean;
  zoom?: number;
  showControls?: boolean;
  className?: string;
};

const COLORS = { user: '#2563EB', route: '#C2410C', done: '#8A9893', ink: '#12201C' };

function userIcon(heading: number | null | undefined) {
  const cone =
    heading == null
      ? ''
      : `<div class="map-user__cone" style="transform: translate(-50%, -100%) rotate(${heading}deg)"></div>`;
  return L.divIcon({
    className: 'map-user',
    html: `${cone}<div class="map-user__dot"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function stopIcon(n: number, variant: 'next' | 'done' | 'todo' | 'highlight') {
  const size = variant === 'highlight' ? 44 : 28;
  return L.divIcon({
    className: `map-stop map-stop--${variant}`,
    html: `<span>${n}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function Follower({ position, follow, onUserPan }: { position: LatLng; follow: boolean; onUserPan?: () => void }) {
  const map = useMap();
  useMapEvents({ dragstart: () => onUserPan?.() });
  useEffect(() => {
    if (follow) map.panTo([position.lat, position.lng], { animate: true });
  }, [follow, map, position.lat, position.lng]);
  return null;
}

function FitRoute({ route }: { route: RouteSuggestion }) {
  const map = useMap();
  useEffect(() => {
    if (route.path.length > 1) map.fitBounds(route.path, { padding: [36, 36] });
  }, [map, route]);
  return null;
}

export function MapView({
  position,
  accuracy,
  heading,
  route,
  nextStopIndex,
  highlightStopIndex = null,
  geofenceMeters,
  reachMeters,
  follow = false,
  onUserPan,
  onRecenter,
  fitRoute = false,
  zoom = 16,
  showControls = true,
  className = '',
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);
  const icon = useMemo(() => userIcon(heading), [heading]);

  // Separa el trazado hecho y el pendiente según la parada siguiente (aproximación por índice de punto)
  const { donePath, todoPath } = useMemo(() => {
    if (!route || nextStopIndex == null || nextStopIndex === 0) return { donePath: [], todoPath: route?.path ?? [] };
    const target = route.stops[Math.min(nextStopIndex, route.stops.length) - 1].position;
    let cut = 0;
    let best = Infinity;
    route.path.forEach(([lat, lng], i) => {
      const d = (lat - target.lat) ** 2 + (lng - target.lng) ** 2;
      if (d < best) {
        best = d;
        cut = i;
      }
    });
    return { donePath: route.path.slice(0, cut + 1), todoPath: route.path.slice(cut) };
  }, [route, nextStopIndex]);

  return (
    <div className={`map ${className}`}>
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={zoom}
        zoomControl={false}
        attributionControl
        ref={(m) => {
          mapRef.current = m;
          if (m && !ready) setReady(true);
        }}
        className="map__leaflet"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {reachMeters ? (
          <Circle
            center={[position.lat, position.lng]}
            radius={reachMeters}
            pathOptions={{ color: '#0B5D45', weight: 1.5, dashArray: '6 6', fillOpacity: 0.06 }}
          />
        ) : null}

        {route && (
          <>
            {donePath.length > 1 && (
              <Polyline positions={donePath} pathOptions={{ color: COLORS.done, weight: 5, dashArray: '2 10' }} />
            )}
            <Polyline positions={todoPath} pathOptions={{ color: '#FFFFFF', weight: 10, opacity: 1 }} />
            <Polyline positions={todoPath} pathOptions={{ color: COLORS.route, weight: 5, opacity: 1 }} />
            {route.stops.map((s, i) => {
              const variant =
                highlightStopIndex === i
                  ? 'highlight'
                  : nextStopIndex == null
                    ? 'todo'
                    : i < nextStopIndex
                      ? 'done'
                      : i === nextStopIndex
                        ? 'next'
                        : 'todo';
              return (
                <Marker key={s.id} position={[s.position.lat, s.position.lng]} icon={stopIcon(i + 1, variant)} />
              );
            })}
            {geofenceMeters && nextStopIndex != null && route.stops[nextStopIndex] && (
              <Circle
                center={[route.stops[nextStopIndex].position.lat, route.stops[nextStopIndex].position.lng]}
                radius={geofenceMeters}
                pathOptions={{ color: COLORS.route, weight: 1.5, dashArray: '4 4', fillOpacity: 0.08 }}
              />
            )}
            {fitRoute && <FitRoute route={route} />}
          </>
        )}

        {accuracy && accuracy < 200 ? (
          <Circle
            center={[position.lat, position.lng]}
            radius={accuracy}
            pathOptions={{ stroke: false, fillColor: COLORS.user, fillOpacity: 0.12 }}
          />
        ) : null}
        <Marker position={[position.lat, position.lng]} icon={icon} zIndexOffset={1000} />
        <Follower position={position} follow={follow} onUserPan={onUserPan} />
      </MapContainer>

      {showControls && ready && (
        <>
          <div className="map__zoom">
            <button type="button" aria-label="Acercar" onClick={() => mapRef.current?.zoomIn()}>
              +
            </button>
            <button type="button" aria-label="Alejar" onClick={() => mapRef.current?.zoomOut()}>
              −
            </button>
          </div>
          <button
            type="button"
            className="map__locate"
            aria-label="Centrar en mi ubicación"
            onClick={() => {
              mapRef.current?.setView([position.lat, position.lng], Math.max(mapRef.current.getZoom(), zoom));
              onRecenter?.();
            }}
          >
            <LocateIcon />
          </button>
        </>
      )}
    </div>
  );
}
