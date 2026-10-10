import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { signOut } from '../lib/auth';
import { UserIcon } from './icons';

export function Header({ kicker, title, left }: { kicker?: string; title?: ReactNode; left?: ReactNode }) {
  const navigate = useNavigate();
  const user = useUser();

  // TODO: pantalla de perfil. De momento el avatar solo sirve para cerrar sesión.
  function onAvatar() {
    if (!user || !window.confirm(`Has entrado como ${user.name}. ¿Cerrar sesión?`)) return;
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="header">
      {left}
      <div className="header__text">
        {kicker && <span className="header__kicker">{kicker}</span>}
        {title && <h1 className="header__title">{title}</h1>}
      </div>
      <button type="button" className="avatar" aria-label={user ? `Perfil de ${user.name}` : 'Perfil'} onClick={onAvatar}>
        {user?.photoUrl ? (
          <img className="avatar__photo" src={user.photoUrl} alt="" />
        ) : user ? (
          <span className="avatar__initials">{initials(user.name)}</span>
        ) : (
          <UserIcon size={22} />
        )}
      </button>
    </header>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function nowLabel() {
  const d = new Date();
  const day = d.toLocaleDateString('es-ES', { weekday: 'long' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`;
}
