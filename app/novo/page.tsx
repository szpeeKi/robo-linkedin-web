import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { FormularioPost } from "@/components/FormularioPost";
import { IconeSeta } from "@/components/icones";
import { criarPost } from "@/lib/actions";
import { linkedinConectado } from "@/lib/credenciais";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// A lista de páginas muda em Configurações, então não pode ficar em cache.
export const dynamic = "force-dynamic";

export default async function NovoPostPage() {
  const supabase = await createSupabaseServerClient();
  const { data: paginas } = await supabase
    .from("linkedin_paginas")
    .select("id, nome")
    .order("nome");

  const { data: userData } = await supabase.auth.getUser();
  const conectado = await linkedinConectado(userData.user?.email);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="mx-auto max-w-xl px-6 py-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <IconeSeta className="size-3.5" />
          Fila de posts
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-1 text-lg font-semibold text-gray-900">
            Novo post
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Escreva o post, escolha quando ele deve sair e deixe o resto com a
            gente. Ele fica na fila até a hora certa.
          </p>

          {!conectado && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              Você ainda não conectou o seu LinkedIn. Os posts saem com a conta de
              quem os agenda, então{" "}
              <Link
                href="/configuracoes"
                className="font-medium underline underline-offset-2"
              >
                conecte o seu em Configurações
              </Link>{" "}
              antes de agendar.
            </div>
          )}

          <FormularioPost
            acao={criarPost}
            rotuloBotao="Agendar post"
            carregandoTexto="Agendando..."
            paginas={paginas ?? []}
            // Com uma página só, já vem escolhida; com várias, o time escolhe.
            paginaIdInicial={paginas?.length === 1 ? paginas[0].id : ""}
          />
        </div>
      </main>
    </div>
  );
}
