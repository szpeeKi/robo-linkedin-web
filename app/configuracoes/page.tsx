import { NavBar } from "@/components/NavBar";
import { FormularioCredencial } from "@/components/FormularioCredencial";
import { PaginasLinkedin } from "@/components/PaginasLinkedin";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Essa página depende de login e de uma chave secreta só disponível em tempo de
// requisição, então nunca deve ser pré-renderizada como página estática.
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const admin = createSupabaseAdminClient();

  // Cada pessoa do time conecta o PRÓPRIO LinkedIn: aqui só aparece (e só se
  // salva) a credencial de quem está logado no app.
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const usuario = userData.user?.email?.toLowerCase() ?? null;

  // Só busca o email e a data de atualização — a senha em si nunca é lida de volta
  // pra dentro do aplicativo, fica só guardada criptografada no Vault.
  const { data: credencial } = usuario
    ? await admin
        .from("linkedin_credenciais")
        .select("email, atualizado_em")
        .eq("usuario_email", usuario)
        .maybeSingle()
    : { data: null };

  const { data: paginas } = await admin
    .from("linkedin_paginas")
    .select("id, nome, admin_url")
    .order("nome");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="mx-auto max-w-md px-6 py-10">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-gray-900">
          Seu LinkedIn
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Cada pessoa conecta o próprio LinkedIn: os posts que <strong>você</strong>{" "}
          agendar saem com a conta que estiver aqui, e não com a de outra pessoa
          do time. A senha fica guardada de forma criptografada — ninguém, nem
          este aplicativo, consegue vê-la de volta depois de salva.
        </p>

        {credencial ? (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-gray-700">
              Sua conta conectada: <strong>{credencial.email}</strong>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Atualizada em{" "}
              {new Date(credencial.atualizado_em).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
              {usuario ? ` · login do app: ${usuario}` : ""}
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Você ainda não conectou o seu LinkedIn. Os posts que você agendar
            não vão conseguir sair até você preencher aqui.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <FormularioCredencial />
        </div>

        <h2 className="mb-1 mt-12 text-xl font-semibold tracking-tight text-gray-900">
          Páginas do LinkedIn
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          As páginas da empresa em que o robô pode publicar. Ao agendar um post,
          você escolhe em qual delas ele sai. O seu LinkedIn (acima) precisa ser
          administrador da página escolhida. A lista de páginas é a mesma pra
          todo o time.
        </p>

        <PaginasLinkedin paginas={paginas ?? []} />
      </main>
    </div>
  );
}
