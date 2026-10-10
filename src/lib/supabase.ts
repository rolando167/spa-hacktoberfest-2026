import { createClient, type Provider } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null si Supabase no está configurado: el login deja pasar sin cuenta. */
export const supabase = url && key ? createClient(url, key) : null;

export async function signInWith(provider: Provider) {
  if (!supabase) return { skipped: true as const };
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/inicio` },
  });
  if (error) throw error;
  return { skipped: false as const };
}

export async function signInWithEmail(email: string) {
  if (!supabase) return { skipped: true as const };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/inicio` },
  });
  if (error) throw error;
  return { skipped: false as const };
}
