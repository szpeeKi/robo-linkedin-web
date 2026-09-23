import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { FormularioPost } from "@/components/FormularioPost";
import { IconeSeta } from "@/components/icones";
import { criarPost } from "@/lib/actions";

export default function NovoPostPage() {
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

          <FormularioPost
            acao={criarPost}
            rotuloBotao="Agendar post"
            carregandoTexto="Agendando..."
          />
        </div>
      </main>
    </div>
  );
}
