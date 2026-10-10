import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { IntentResponse, RouteSuggestion } from '../lib/types';

type AppState = {
  intent: IntentResponse | null;
  setIntent: (i: IntentResponse | null) => void;
  route: RouteSuggestion | null;
  setRoute: (r: RouteSuggestion | null) => void;
  reset: () => void;
};

const Ctx = createContext<AppState | null>(null);

function load<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: seguimos en memoria */
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<IntentResponse | null>(() => load('intent'));
  const [route, setRouteState] = useState<RouteSuggestion | null>(() => load('route'));

  const value = useMemo<AppState>(
    () => ({
      intent,
      route,
      setIntent: (i) => {
        save('intent', i);
        setIntentState(i);
      },
      setRoute: (r) => {
        save('route', r);
        setRouteState(r);
      },
      reset: () => {
        save('intent', null);
        save('route', null);
        setIntentState(null);
        setRouteState(null);
      },
    }),
    [intent, route],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState fuera de AppStateProvider');
  return ctx;
}
