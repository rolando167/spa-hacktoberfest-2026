import type { ReactNode } from 'react';
import { UserIcon } from './icons';

export function Header({ kicker, title, left }: { kicker?: string; title?: ReactNode; left?: ReactNode }) {
  return (
    <header className="header">
      {left}
      <div className="header__text">
        {kicker && <span className="header__kicker">{kicker}</span>}
        {title && <h1 className="header__title">{title}</h1>}
      </div>
      <button type="button" className="avatar" aria-label="Perfil">
        <UserIcon size={22} />
      </button>
    </header>
  );
}

export function nowLabel() {
  const d = new Date();
  const day = d.toLocaleDateString('es-ES', { weekday: 'long' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`;
}
