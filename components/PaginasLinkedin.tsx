"use client";

import { useActionState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { MensagemAcao } from "@/components/MensagemAcao";
import { Campo } from "@/components/Campo";
import { IconeLixeira } from "@/components/icones";
import { classesCampo } from "@/lib/ui";
import { adicionarPaginaLinkedin, removerPaginaLinkedin } from "@/lib/actions";

export type PaginaCadastrada = { id: string; nome: string; admin_url: string };

function LinhaDaPagina({ pagina }: { pagina: PaginaCadastrada }) {
  const [estado, formAction] = useActionState(removerPaginaLinkedin, null);

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {pagina.nome}
          </p>
          <p className="truncate text-xs text-gray-400">{pagina.admin_url}</p>
        </div>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `Tirar "${pagina.nome}" da lista? Posts já publicados não mudam.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={pagina.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <IconeLixeira className="size-3.5" />
            Remover
          </button>
        </form>
      </div>
      {estado?.erro && (
        <p className="mt-2 text-xs text-red-600">{estado.erro}</p>
      )}
    </li>
  );
}

export function PaginasLinkedin({ paginas }: { paginas: PaginaCadastrada[] }) {
  const [estado, formAction] = useActionState(adicionarPaginaLinkedin, null);

  return (
    <div className="space-y-5">
      {paginas.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4 shadow-sm">
          {paginas.map((pagina) => (
            <LinhaDaPagina key={pagina.id} pagina={pagina} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Nenhuma página cadastrada. Sem páginas, o robô publica na página
          padrão configurada nele.
        </div>
      )}

      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-gray-900">
          Adicionar página
        </h3>

        <Campo label="Nome da página">
          <input
            type="text"
            name="nome"
            required
            autoComplete="off"
            className={classesCampo}
            placeholder="Igual ao que aparece no LinkedIn"
          />
          <p className="text-xs text-gray-400">
            O robô confere esse nome na hora de publicar. Se estiver diferente
            do LinkedIn, ele para em vez de postar.
          </p>
        </Campo>

        <Campo label="Link da página">
          <input
            type="text"
            name="link"
            required
            autoComplete="off"
            className={classesCampo}
            placeholder="https://www.linkedin.com/company/nome-da-pagina/"
          />
          <p className="text-xs text-gray-400">
            Abra a página no LinkedIn e copie o endereço da barra do navegador.
          </p>
        </Campo>

        <MensagemAcao estado={estado} />

        <BotaoEnviar carregandoTexto="Adicionando...">
          Adicionar página
        </BotaoEnviar>
      </form>
    </div>
  );
}
