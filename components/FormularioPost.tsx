"use client";

import { useActionState, useState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { MensagemAcao } from "@/components/MensagemAcao";
import { Campo } from "@/components/Campo";
import { classesCampo } from "@/lib/ui";
import { LIMITE_CARACTERES_POST } from "@/lib/constantes";
import type { EstadoAcao } from "@/lib/actions";

export type ValoresIniciaisPost = {
  id: string;
  texto: string;
  imagem_url: string | null;
  data_agendada: string; // yyyy-mm-dd, já no fuso de São Paulo
  hora_agendada: string; // HH:mm, já no fuso de São Paulo
};

export function FormularioPost({
  acao,
  valoresIniciais,
  rotuloBotao,
  carregandoTexto,
}: {
  acao: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  valoresIniciais?: ValoresIniciaisPost;
  rotuloBotao: string;
  carregandoTexto: string;
}) {
  const [estado, formAction] = useActionState(acao, null);
  const [texto, setTexto] = useState(valoresIniciais?.texto ?? "");

  const hoje = new Date().toISOString().slice(0, 10);
  const restantes = LIMITE_CARACTERES_POST - texto.length;
  const passouDoLimite = restantes < 0;

  return (
    <form action={formAction} className="space-y-5">
      {valoresIniciais && (
        <input type="hidden" name="id" value={valoresIniciais.id} />
      )}

      <Campo
        label="Texto do post"
        hint={
          <span
            className={`text-xs ${
              passouDoLimite ? "font-medium text-red-600" : "text-gray-400"
            }`}
          >
            {restantes} caracteres restantes
          </span>
        }
      >
        <textarea
          name="texto"
          required
          rows={8}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className={classesCampo}
          placeholder="Escreva o post exatamente como deve ficar no LinkedIn..."
        />
      </Campo>

      <Campo label="Link da imagem (opcional)">
        <input
          type="url"
          name="imagem_url"
          defaultValue={valoresIniciais?.imagem_url ?? ""}
          className={classesCampo}
          placeholder="https://..."
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Data">
          <input
            type="date"
            name="data_agendada"
            required
            min={hoje}
            defaultValue={valoresIniciais?.data_agendada ?? hoje}
            className={classesCampo}
          />
        </Campo>
        <Campo label="Horário">
          <input
            type="time"
            name="hora_agendada"
            required
            defaultValue={valoresIniciais?.hora_agendada}
            className={classesCampo}
          />
        </Campo>
      </div>
      <p className="-mt-3 text-xs text-gray-400">Horário de Brasília.</p>

      <MensagemAcao estado={estado} />

      <BotaoEnviar carregandoTexto={carregandoTexto}>
        {rotuloBotao}
      </BotaoEnviar>
    </form>
  );
}
