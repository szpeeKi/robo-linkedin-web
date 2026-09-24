// Avisos sobre o robô no topo da fila: um problema que precisa de uma pessoa
// (alerta gravado pelo robô) e/ou o robô parado há tempo demais.

export const MINUTOS_SEM_SINAL_ATE_AVISAR = 30; // o robô roda a cada 10 min

function tempoSemSinal(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `${horas} h`;
  return `${Math.floor(horas / 24)} dias`;
}

export function AvisoDoRobo({
  robo,
  minutosSemSinal,
}: {
  robo: { ultima_execucao: string; alerta: string | null } | null;
  minutosSemSinal: number | null;
}) {
  const semSinal =
    minutosSemSinal !== null && minutosSemSinal > MINUTOS_SEM_SINAL_ATE_AVISAR;

  if (robo && !robo.alerta && !semSinal) return null;

  return (
    <div className="mb-6 space-y-3">
      {!robo && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>O robô ainda não deu sinal de vida.</strong> Confira se ele está
          instalado no computador do marketing e se o computador está ligado. Os
          posts só saem quando o robô está rodando.
        </div>
      )}

      {robo?.alerta && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>O robô precisa de ajuda:</strong> {robo.alerta}
        </div>
      )}

      {robo && semSinal && minutosSemSinal !== null && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>O robô não dá sinal há {tempoSemSinal(minutosSemSinal)}</strong>{" "}
          (último sinal:{" "}
          {new Date(robo.ultima_execucao).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
          ). Enquanto isso, os posts agendados não saem. Confira se o computador do
          marketing está ligado e com internet.
        </div>
      )}
    </div>
  );
}
