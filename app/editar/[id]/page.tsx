import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NavBar } from "@/components/NavBar";
import { FormularioPost } from "@/components/FormularioPost";
import { IconeSeta } from "@/components/icones";
import { editarPost } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Converte o timestamp UTC salvo no banco de volta pra data/hora "de parede"
// em São Paulo, o inverso exato de como o formulário monta o timestamp ao
// salvar (`${data}T${hora}:00-03:00`).
function paraDataHoraSaoPaulo(agendadoParaUtc: string) {
  const local = new Date(
    new Date(agendadoParaUtc).getTime() - 3 * 60 * 60 * 1000
  );
  const iso = local.toISOString();
  return { data: iso.slice(0, 10), hora: iso.slice(11, 16) };
}

export default async function EditarPostPage({
  params,
}: PageProps<"/editar/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase
    .from("linkedin_posts_agendados")
    .select("id, texto, imagem_url, agendado_para, status")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const hora = paraDataHoraSaoPaulo(post.agendado_para);

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
            Editar post
          </h1>

          {post.status !== "pendente" ? (
            <p className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              Esse post já não está mais pendente, então não dá mais pra
              editar.
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">
                Altere o texto, a imagem ou o horário. Ele continua na fila
                normalmente depois de salvar.
              </p>

              <FormularioPost
                acao={editarPost}
                valoresIniciais={{
                  id: post.id,
                  texto: post.texto,
                  imagem_url: post.imagem_url,
                  data_agendada: hora.data,
                  hora_agendada: hora.hora,
                }}
                rotuloBotao="Salvar alterações"
                carregandoTexto="Salvando..."
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
