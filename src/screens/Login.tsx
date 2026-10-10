import type { Provider } from '@supabase/supabase-js';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, MicIcon } from '../components/icons';
import { signInWith, signInWithEmail, supabase } from '../lib/supabase';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'google', label: 'Continuar con Google' },
  { id: 'apple', label: 'Continuar con Apple' },
  { id: 'facebook', label: 'Continuar con Facebook' },
];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function social(p: Provider) {
    setBusy(true);
    try {
      const r = await signInWith(p);
      if (r.skipped) navigate('/inicio'); // sin Supabase configurado, entramos directamente
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function byEmail(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const r = await signInWithEmail(email);
      if (r.skipped) navigate('/inicio');
      else setMessage('Te hemos enviado un enlace. Ábrelo desde este móvil.');
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <div className="login__hero" aria-hidden="true">
        <svg viewBox="0 0 390 330" preserveAspectRatio="xMidYMid slice">
          <g stroke="#1F322C" fill="none" strokeLinecap="round">
            <path d="M-10 70 L400 90" strokeWidth="6" />
            <path d="M-10 170 L400 150" strokeWidth="10" />
            <path d="M-10 260 L400 270" strokeWidth="6" />
            <path d="M70 -10 L90 340" strokeWidth="6" />
            <path d="M190 -10 L180 340" strokeWidth="10" />
            <path d="M310 -10 L290 340" strokeWidth="6" />
            <path d="M-10 330 L260 -10" strokeWidth="7" />
          </g>
          <path d="M84 262 L84 162 L184 157 L184 83 L300 87" fill="none" stroke="#F97316" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="84" cy="262" r="26" fill="#2563EB" opacity="0.2" />
          <circle cx="84" cy="262" r="9" fill="#2563EB" stroke="#12201C" strokeWidth="3" />
          <circle cx="84" cy="200" r="11" fill="#12201C" stroke="#F97316" strokeWidth="3" />
          <circle cx="184" cy="120" r="11" fill="#12201C" stroke="#F97316" strokeWidth="3" />
          <circle cx="300" cy="87" r="14" fill="#F97316" />
        </svg>
      </div>
      <div className="login__brand">
        <span className="login__logo">
          <MicIcon size={16} />
        </span>
        {/* TODO: nombre definitivo de la app */}
        Rutas por voz
      </div>

      <section className="login__sheet">
        <h1 className="display">
          Dime qué te apetece.
          <br />
          Te propongo la ruta.
        </h1>
        <p className="muted">Entra para guardar tus rutas y retomar las que dejaste a medias.</p>

        {PROVIDERS.map((p) => (
          <button key={p.id} type="button" className="btn btn--social" disabled={busy} onClick={() => social(p.id)}>
            {/* TODO: logo oficial del proveedor (24×24) desde su guía de marca */}
            <span className="btn__logo" aria-hidden="true" />
            <span className="btn__label">{p.label}</span>
          </button>
        ))}

        <div className="divider">
          <span>o con tu correo</span>
        </div>

        <form className="email" onSubmit={byEmail}>
          <label className="sr-only" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn--icon btn--primary" aria-label="Enviar enlace de acceso" disabled={busy}>
            <ArrowRightIcon />
          </button>
        </form>
        <span className="muted small">{message ?? 'Te enviamos un enlace. Sin contraseñas.'}</span>
        {!supabase && <span className="muted small">Modo desarrollo: Supabase sin configurar, entras sin cuenta.</span>}

        <div className="grow" />
        <button type="button" className="link" onClick={() => navigate('/inicio')}>
          Probar sin cuenta
        </button>
        <p className="legal">
          Al continuar aceptas los <a href="#terminos">Términos</a> y la <a href="#privacidad">Política de privacidad</a>.
        </p>
      </section>
    </main>
  );
}
