import type { Poi } from '../lib/types';

export function PoiPhoto({ poi, className = '' }: { poi: Poi; className?: string }) {
  return poi.photoUrl ? (
    <img className={`photo ${className}`} src={poi.photoUrl} alt={poi.name} loading="lazy" />
  ) : (
    <div className={`photo photo--empty ${className}`} role="img" aria-label={`Sin foto de ${poi.name}`}>
      Sin foto
    </div>
  );
}

export function PoiCard({ poi, index }: { poi: Poi; index: number }) {
  return (
    <article className="poi">
      <PoiPhoto poi={poi} className="poi__photo" />
      <div className="poi__body">
        <h3 className="poi__title">
          <span className="badge">{index + 1}</span>
          {poi.name}
        </h3>
        <p className="poi__text">{poi.short}</p>
        <span className="muted small">
          {poi.walkMinutesFromPrev} min {index === 0 ? 'desde aquí' : `desde la parada ${index}`}
        </span>
      </div>
    </article>
  );
}
