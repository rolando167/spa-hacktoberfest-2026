// Login simulado para la demo: «Continuar con Google» entra con un usuario de prueba.
// No hay red ni claves; la sesión vive en localStorage.

export type User = { name: string; email: string; photoUrl: string | null };

const KEY = 'rutas-voz:user';
const MOCK_USER: User = { name: 'Lucía Martín', email: 'lucia.martin@gmail.com', photoUrl: null };

const listeners = new Set<() => void>();
let current: User | null = read();

function read(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function set(user: User | null) {
  current = user;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function signInWithGoogle() {
  set(MOCK_USER);
}

export function signOut() {
  set(null);
}

export function getUser() {
  return current;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
