"use client";

import { useActionState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { MensagemAcao } from "@/components/MensagemAcao";
import { Campo } from "@/components/Campo";
import { classesCampo } from "@/lib/ui";
import { salvarCredencialLinkedin } from "@/lib/actions";

export function FormularioCredencial() {
  const [estado, formAction] = useActionState(salvarCredencialLinkedin, null);

  return (
    <form action={formAction} className="space-y-5">
      <Campo label="Email do LinkedIn">
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          className={classesCampo}
        />
      </Campo>

      <Campo label="Senha do LinkedIn">
        <input
          type="password"
          name="senha"
          required
          autoComplete="new-password"
          className={classesCampo}
        />
      </Campo>

      <MensagemAcao estado={estado} />

      <BotaoEnviar carregandoTexto="Salvando...">
        Salvar credencial
      </BotaoEnviar>
    </form>
  );
}
