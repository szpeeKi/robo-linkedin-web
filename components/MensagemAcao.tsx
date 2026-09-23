import type { EstadoAcao } from "@/lib/actions";

// Mostra o resultado de uma ação (erro em vermelho, sucesso em verde) de um
// jeito amigável, em vez de deixar a página quebrar com um erro técnico.
export function MensagemAcao({ estado }: { estado: EstadoAcao }) {
  if (!estado) return null;

  if (estado.erro) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {estado.erro}
      </div>
    );
  }

  if (estado.sucesso) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
        {estado.sucesso}
      </div>
    );
  }

  return null;
}
