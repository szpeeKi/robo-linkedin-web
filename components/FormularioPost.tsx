"use client";

import { useActionState, useState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { MensagemAcao } from "@/components/MensagemAcao";
import { Campo } from "@/components/Campo";
import { classesCampo } from "@/lib/ui";
import {
  BUCKET_MIDIAS,
  LIMITE_CARACTERES_POST,
  urlEhVideo,
} from "@/lib/constantes";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { prepararUploadDeMidia, type EstadoAcao } from "@/lib/actions";

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
  const [urlMidia, setUrlMidia] = useState(valoresIniciais?.imagem_url ?? "");
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [erroMidia, setErroMidia] = useState<string | null>(null);
  const [nomeArquivoEnviado, setNomeArquivoEnviado] = useState<string | null>(
    null
  );

  // Manda o arquivo escolhido direto pro Storage (ver prepararUploadDeMidia) e
  // preenche o campo de link com a URL final — o resto do formulário só enxerga
  // uma URL, seja ela colada ou vinda de um arquivo enviado.
  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    setErroMidia(null);
    setNomeArquivoEnviado(null);
    setEnviandoMidia(true);
    try {
      const preparo = await prepararUploadDeMidia({
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
      });
      if ("erro" in preparo) {
        setErroMidia(preparo.erro);
        return;
      }

      const { error } = await createSupabaseBrowserClient()
        .storage.from(BUCKET_MIDIAS)
        .uploadToSignedUrl(preparo.caminho, preparo.token, arquivo, {
          contentType: arquivo.type,
        });
      if (error) {
        setErroMidia(`Não consegui enviar o arquivo: ${error.message}`);
        return;
      }

      setUrlMidia(preparo.urlPublica);
      setNomeArquivoEnviado(arquivo.name);
    } catch {
      setErroMidia("Não consegui enviar o arquivo. Tente de novo.");
    } finally {
      setEnviandoMidia(false);
      input.value = ""; // permite escolher o mesmo arquivo de novo se precisar
    }
  }

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

      <Campo label="Foto ou vídeo do post (opcional)">
        <input
          type="url"
          name="imagem_url"
          value={urlMidia}
          onChange={(e) => {
            setUrlMidia(e.target.value);
            setNomeArquivoEnviado(null);
          }}
          className={classesCampo}
          placeholder="Cole o link direto do arquivo (https://...)"
        />
        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={aoEscolherArquivo}
          disabled={enviandoMidia}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-60"
        />
        {enviandoMidia ? (
          <p className="text-xs text-gray-500">
            Enviando o arquivo... vídeos grandes podem demorar um pouco. Não
            feche essa página.
          </p>
        ) : nomeArquivoEnviado ? (
          <p className="text-xs text-green-700">
            Arquivo enviado: {nomeArquivoEnviado}
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Fotos até 8 MB e vídeos até 50 MB. Escolher um arquivo substitui o
            link colado acima.
          </p>
        )}
        {erroMidia && <p className="text-xs text-red-600">{erroMidia}</p>}

        {urlMidia &&
          (urlEhVideo(urlMidia) ? (
            <video
              src={urlMidia}
              controls
              preload="metadata"
              className="mt-2 max-h-56 rounded-lg border border-gray-200"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlMidia}
              alt="Prévia da foto do post"
              className="mt-2 max-h-56 rounded-lg border border-gray-200"
            />
          ))}
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

      <BotaoEnviar
        carregandoTexto={carregandoTexto}
        desabilitado={enviandoMidia}
      >
        {rotuloBotao}
      </BotaoEnviar>
    </form>
  );
}
