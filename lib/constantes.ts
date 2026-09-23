// Limite de caracteres de um post do LinkedIn. Usado tanto na validação do
// servidor (lib/actions.ts) quanto no contador ao vivo do formulário
// (components/FormularioPost.tsx) — mude só aqui se o LinkedIn mudar o limite.
export const LIMITE_CARACTERES_POST = 3000;

// Bucket do Supabase Storage onde ficam as mídias (fotos e vídeos) dos posts.
// O nome ficou "linkedin-imagens" de quando só havia foto; renomear exigiria
// migrar os arquivos e as URLs já salvas, então continua igual.
export const BUCKET_MIDIAS = "linkedin-imagens";

export const TAMANHO_MAXIMO_IMAGEM = 8 * 1024 * 1024; // 8 MB
// O teto real de um arquivo é o do plano do Supabase (50 MB no plano
// gratuito) — se o plano subir, é só aumentar aqui.
export const TAMANHO_MAXIMO_VIDEO = 50 * 1024 * 1024; // 50 MB

const EXTENSOES_VIDEO = [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"];

// Decide se uma URL de mídia é vídeo pela extensão do arquivo (ignora
// querystring). Usado só pra rotular/pré-visualizar na tela; quem decide de
// verdade como anexar no LinkedIn é o robô, olhando o tipo real do arquivo.
export function urlEhVideo(url: string): boolean {
  let caminho = url;
  try {
    caminho = new URL(url).pathname;
  } catch {
    // não é uma URL completa — usa o texto como veio
  }
  const minusculo = caminho.toLowerCase();
  return EXTENSOES_VIDEO.some((ext) => minusculo.endsWith(ext));
}
