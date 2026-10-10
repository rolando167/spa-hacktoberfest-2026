import { useSyncExternalStore } from 'react';
import { getUser, subscribe } from '../lib/auth';

/** Usuario con sesión iniciada, o null. Se actualiza al entrar y al salir. */
export function useUser() {
  return useSyncExternalStore(subscribe, getUser);
}
