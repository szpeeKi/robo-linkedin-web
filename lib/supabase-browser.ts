import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase pra usar dentro do navegador (componentes "use client").
// Usa só a chave pública (anon/publishable) — nunca a service role aqui.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
