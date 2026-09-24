"use client";

import Link from "next/link";
import { useActionState } from "react";
import { apagarPost } from "@/lib/actions";
import { IconeLapis, IconeLixeira } from "@/components/icones";

export function AcoesPost({
  id,
  status,
}: {
  id: string;
  status: "pendente" | "erro";
}) {
  const [estado, formAction] = useActionState(apagarPost, null);

  return (
    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
      {estado?.erro && (
        <span className="mr-auto text-xs text-red-600">{estado.erro}</span>
      )}

      {/* Post com erro também abre o formulário: salvar devolve o post pra fila
          (com o horário novo), que é o "Tentar de novo". */}
      <Link
        href={`/editar/${id}`}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <IconeLapis className="size-3.5" />
        {status === "erro" ? "Tentar de novo" : "Editar"}
      </Link>

      <form
        action={formAction}
        onSubmit={(e) => {
          if (
            !confirm(
              "Excluir esse post agendado? Essa ação não pode ser desfeita."
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <IconeLixeira className="size-3.5" />
          Excluir
        </button>
      </form>
    </div>
  );
}
