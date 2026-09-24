import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NavBar } from "@/components/NavBar";
import { AcoesPost } from "@/components/AcoesPost";
import { AvisoDoRobo } from "@/components/AvisoDoRobo";
import { IconePlus } from "@/components/icones";
import { urlEhVideo } from "@/lib/constantes";
import { minutosDesde } from "@/lib/tempo";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  pendente: "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20",
  publicando: "bg-blue-50 text-blue-800 ring-1 ring-blue-600/20",
  publicado: "bg-green-50 text-green-800 ring-1 ring-green-600/20",
  erro: "bg-red-50 text-red-800 ring-1 ring-red-600/20",
};

const statusDot: Record<string, string> = {
  pendente: "bg-yellow-500",
  publicando: "bg-blue-500",
  publicado: "bg-green-500",
  erro: "bg-red-500",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  publicando: "Publicando...",
  publicado: "Publicado",
  erro: "Erro",
};

function formatarData(iso: string) {
  return new Date(iso)
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(".", "");
}

export default async function FilaDePosts() {
  const supabase = await createSupabaseServerClient();

  const { data: posts, error } = await supabase
    .from("linkedin_posts_agendados")
    .select(
      "id, texto, imagem_url, agendado_para, status, erro_mensagem, criado_por, linkedin_post_url, pagina_nome"
    )
    .order("agendado_para", { ascending: true });

  const pendentes = posts?.filter((p) => p.status === "pendente").length ?? 0;
  const comErro = posts?.filter((p) => p.status === "erro").length ?? 0;

  // Sinal de vida do robô (ele grava a cada execução); o aviso aparece se
  // ficar tempo demais sem sinal ou se o robô deixou um alerta pra uma pessoa.
  const { data: robo } = await supabase
    .from("robo_status")
    .select("ultima_execucao, alerta")
    .eq("id", 1)
    .maybeSingle();
  const minutosSemSinal = robo ? minutosDesde(robo.ultima_execucao) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Fila de posts
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {!posts?.length
                ? "Nada agendado ainda."
                : pendentes === 0
                  ? "Nenhum post esperando pra sair agora."
                  : `${pendentes} post${pendentes > 1 ? "s" : ""} na fila esperando a hora certa.`}
              {comErro > 0 && (
                <span className="font-medium text-red-600">
                  {" "}
                  · {comErro} com erro
                </span>
              )}
            </p>
          </div>
          <Link
            href="/novo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            <IconePlus className="size-4" />
            Novo post
          </Link>
        </div>

        <AvisoDoRobo robo={robo} minutosSemSinal={minutosSemSinal} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não consegui carregar os posts: {error.message}
          </div>
        )}

        {!error && posts?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">
              Nenhum post agendado ainda.
            </p>
            <Link
              href="/novo"
              className="mt-3 inline-block text-sm font-medium text-gray-900 underline underline-offset-2"
            >
              Criar o primeiro post
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {posts?.map((post) => (
            <li
              key={post.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusStyle[post.status] ??
                    "bg-gray-100 text-gray-700 ring-1 ring-gray-500/10"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      statusDot[post.status] ?? "bg-gray-400"
                    }`}
                  />
                  {statusLabel[post.status] ?? post.status}
                </span>
                <span className="text-xs text-gray-400">
                  {formatarData(post.agendado_para)}
                </span>
              </div>

              {post.pagina_nome && (
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Página: {post.pagina_nome}
                </p>
              )}

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {post.texto}
              </p>

              {post.imagem_url && (
                <p className="mt-2 truncate text-xs text-gray-400">
                  {urlEhVideo(post.imagem_url) ? "Vídeo" : "Imagem"}
                  {/* Depois de publicado, o robô apaga o arquivo do armazenamento
                      (pra não encher o espaço), então o link deixa de funcionar. */}
                  {post.status === "publicado"
                    ? " anexado ao post"
                    : `: ${post.imagem_url}`}
                </p>
              )}

              {post.status === "publicado" && post.linkedin_post_url && (
                <a
                  href={post.linkedin_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                >
                  Ver post no LinkedIn ↗
                </a>
              )}

              {post.status === "erro" && post.erro_mensagem && (
                <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                  {post.erro_mensagem}
                </p>
              )}

              {(post.status === "pendente" || post.status === "erro") && (
                <AcoesPost id={post.id} status={post.status} />
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
