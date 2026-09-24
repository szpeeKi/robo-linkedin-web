// Funções que dependem da hora de agora. Ficam aqui, fora dos componentes, porque
// as páginas são renderizadas no servidor a cada requisição (force-dynamic) — ler
// a hora atual nelas é o comportamento desejado, e a regra de pureza do React só
// reclama quando a chamada a Date.now() está escrita dentro do componente.

export function minutosDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function isoDaquiAMinutos(minutos: number): string {
  return new Date(Date.now() + minutos * 60 * 1000).toISOString();
}
