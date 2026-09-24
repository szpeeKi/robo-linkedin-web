// Monta o endereço do painel de administrador de uma página do LinkedIn a partir
// do que a pessoa colou: o link público da página (linkedin.com/company/nome/),
// o link do painel de admin (.../company/nome/admin/...) ou só o "nome" da página
// no endereço (o pedaço depois de /company/). Devolve null se não der pra entender.
export function montarUrlAdminDaPagina(entrada: string): string | null {
  const texto = entrada.trim();
  if (!texto) return null;

  const dentroDeLink = texto.match(/\/company\/([^/?#\s]+)/i);
  const identificador = dentroDeLink
    ? dentroDeLink[1]
    : /^[\w.%-]+$/.test(texto)
      ? texto
      : null;

  if (!identificador) return null;
  return `https://www.linkedin.com/company/${identificador.toLowerCase()}/admin/dashboard/`;
}
