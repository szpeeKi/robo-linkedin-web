import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com a chave "service_role" (secreta).
// SÓ pode ser usado dentro de rotas de servidor (app/api/**), NUNCA em código
// que roda no navegador — essa chave ignora o RLS e tem acesso total ao banco.
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Preencha o .env.local com a chave " +
        "service_role do painel do Supabase (Project Settings > API)."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
