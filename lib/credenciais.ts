import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// Esse login do app já conectou o próprio LinkedIn? (Só confere se existe; a
// senha nunca é lida.) Usa o client admin porque a tabela não tem policy de
// leitura. Fica fora de lib/actions.ts de propósito: tudo que um arquivo "use
// server" exporta vira um endpoint que o navegador consegue chamar.
export async function linkedinConectado(
  usuarioEmail: string | null | undefined
): Promise<boolean> {
  if (!usuarioEmail) return false;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("linkedin_credenciais")
    .select("id")
    .eq("usuario_email", usuarioEmail.toLowerCase())
    .maybeSingle();
  return !!data;
}
