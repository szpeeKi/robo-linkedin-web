"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  BUCKET_MIDIAS,
  LIMITE_CARACTERES_POST,
  TAMANHO_MAXIMO_IMAGEM,
  TAMANHO_MAXIMO_VIDEO,
} from "@/lib/constantes";

export type EstadoAcao = { erro?: string; sucesso?: string } | null;

export type UploadPreparado =
  | { erro: string }
  | { caminho: string; token: string; urlPublica: string };

// Primeiro passo do envio de uma foto/vídeo do computador: valida o arquivo e
// devolve uma URL de upload assinada, com a qual o NAVEGADOR manda o arquivo
// direto pro Storage do Supabase. O arquivo não passa por aqui de propósito —
// vídeo é grande demais pro limite de corpo das Server Actions e das funções do
// Netlify. Usa o client admin (service_role) pra assinar, no mesmo padrão de
// salvarCredencialLinkedin, então não depende de policy de RLS no bucket.
export async function prepararUploadDeMidia(dados: {
  nome: string;
  tipo: string;
  tamanho: number;
}): Promise<UploadPreparado> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sua sessão expirou. Atualize a página e entre de novo." };
  }

  const ehVideo = dados.tipo.startsWith("video/");
  const ehImagem = dados.tipo.startsWith("image/");
  if (!ehVideo && !ehImagem) {
    return { erro: "O arquivo escolhido não é uma foto nem um vídeo." };
  }
  if (ehImagem && dados.tamanho > TAMANHO_MAXIMO_IMAGEM) {
    return { erro: "A foto escolhida passa de 8 MB. Escolha uma menor." };
  }
  if (ehVideo && dados.tamanho > TAMANHO_MAXIMO_VIDEO) {
    return { erro: "O vídeo escolhido passa de 50 MB. Escolha um menor." };
  }

  const extensao = dados.nome.includes(".")
    ? dados.nome.slice(dados.nome.lastIndexOf(".")).toLowerCase()
    : "";
  const caminho = `${crypto.randomUUID()}${extensao}`;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET_MIDIAS)
    .createSignedUploadUrl(caminho);

  if (error || !data) {
    return {
      erro: `Não consegui preparar o envio: ${error?.message ?? "sem resposta"}`,
    };
  }

  const { data: publica } = admin.storage
    .from(BUCKET_MIDIAS)
    .getPublicUrl(caminho);

  return { caminho, token: data.token, urlPublica: publica.publicUrl };
}

// Lê e valida os campos de texto/mídia/data/hora que o formulário de post
// (criar e editar) manda. Compartilhado pelas duas actions abaixo pra manter
// as mesmas regras (limite de caracteres, fuso horário) num lugar só.
//
// A mídia (foto ou vídeo) chega sempre como uma URL em "imagem_url" — colada
// pelo usuário, ou preenchida pelo formulário depois de enviar o arquivo
// escolhido (ver prepararUploadDeMidia). O nome do campo/coluna ficou
// "imagem_url" de quando só havia foto: o robô já instalado lê essa coluna, e
// renomear quebraria ele.
async function lerCamposDoFormulario(
  formData: FormData
): Promise<
  { erro: string } | { texto: string; imagemUrl: string; agendadoParaUtc: Date }
> {
  const texto = String(formData.get("texto") ?? "").trim();
  const imagemUrl = String(formData.get("imagem_url") ?? "").trim();
  const dataAgendada = String(formData.get("data_agendada") ?? "");
  const horaAgendada = String(formData.get("hora_agendada") ?? "");

  if (!texto) {
    return { erro: "Escreva o texto do post antes de salvar." };
  }
  if (texto.length > LIMITE_CARACTERES_POST) {
    return {
      erro: `O texto está com ${texto.length} caracteres. O LinkedIn permite no máximo ${LIMITE_CARACTERES_POST}.`,
    };
  }
  if (!dataAgendada || !horaAgendada) {
    return { erro: "Escolha a data e o horário do agendamento." };
  }

  // O input <input type="date"> + <input type="time"> não manda fuso horário.
  // Aqui a gente monta o horário assumindo o fuso de São Paulo
  // (America/Sao_Paulo, UTC-3) e converte pra UTC antes de salvar, porque o
  // banco guarda tudo em UTC (timestamptz).
  const agendadoParaUtc = new Date(
    `${dataAgendada}T${horaAgendada}:00-03:00`
  );

  if (agendadoParaUtc.getTime() < Date.now() - 60_000) {
    return { erro: "Escolha um horário no futuro — esse já passou." };
  }

  return { texto, imagemUrl, agendadoParaUtc };
}

// Cria um novo post agendado. Só funciona pra quem está logado (a policy de RLS
// "usuarios logados podem criar posts agendados" já garante isso no banco).
export async function criarPost(
  _estadoAnterior: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sua sessão expirou. Atualize a página e entre de novo." };
  }

  const campos = await lerCamposDoFormulario(formData);
  if ("erro" in campos) return campos;

  const { error } = await supabase.from("linkedin_posts_agendados").insert({
    texto: campos.texto,
    imagem_url: campos.imagemUrl || null,
    agendado_para: campos.agendadoParaUtc.toISOString(),
    criado_por: userData.user.email ?? "desconhecido",
  });

  if (error) {
    return { erro: `Não consegui salvar o post: ${error.message}` };
  }

  revalidatePath("/");
  redirect("/");
}

// Edita um post que ainda está "pendente" (texto, imagem e/ou horário). O
// .eq("status", "pendente") na atualização é o que impede editar um post que
// acabou de publicar/errar entre a página carregar e o envio do formulário.
export async function editarPost(
  _estadoAnterior: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sua sessão expirou. Atualize a página e entre de novo." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { erro: "Post inválido." };
  }

  const campos = await lerCamposDoFormulario(formData);
  if ("erro" in campos) return campos;

  const { error, count } = await supabase
    .from("linkedin_posts_agendados")
    .update(
      {
        texto: campos.texto,
        imagem_url: campos.imagemUrl || null,
        agendado_para: campos.agendadoParaUtc.toISOString(),
      },
      { count: "exact" }
    )
    .eq("id", id)
    .eq("status", "pendente");

  if (error) {
    return { erro: `Não consegui salvar as alterações: ${error.message}` };
  }
  if (!count) {
    return {
      erro: "Esse post não está mais pendente, então não dá mais pra editar.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

// Apaga um post (só faz sentido pra posts que ainda estão "pendente").
export async function apagarPost(
  _estadoAnterior: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sua sessão expirou. Atualize a página e entre de novo." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return null;

  const { error } = await supabase
    .from("linkedin_posts_agendados")
    .delete()
    .eq("id", id);

  if (error) {
    return { erro: `Não consegui cancelar: ${error.message}` };
  }

  revalidatePath("/");
  return { sucesso: "Post cancelado." };
}

// Grava (ou substitui) a credencial do LinkedIn usada pelo robô.
// Usa a service_role key (createSupabaseAdminClient) só aqui dentro, no servidor —
// essa chave nunca é exposta ao navegador. A senha em si nunca fica em texto puro:
// a função "definir_credencial_linkedin" guarda ela criptografada no Supabase Vault.
export async function salvarCredencialLinkedin(
  _estadoAnterior: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { erro: "Sua sessão expirou. Atualize a página e entre de novo." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha o email e a senha do LinkedIn." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("definir_credencial_linkedin", {
    p_email: email,
    p_senha: senha,
    p_atualizado_por: userData.user.email ?? "desconhecido",
  });

  if (error) {
    return { erro: `Não consegui salvar a credencial: ${error.message}` };
  }

  revalidatePath("/configuracoes");
  return { sucesso: "Credencial salva! O robô já vai usar essa conta a partir de agora." };
}
