"use client";

import { useFormStatus } from "react-dom";

export function BotaoEnviar({
  children,
  carregandoTexto,
  variante = "primario",
  desabilitado = false,
}: {
  children: React.ReactNode;
  carregandoTexto: string;
  variante?: "primario" | "perigo";
  desabilitado?: boolean;
}) {
  const { pending } = useFormStatus();

  const estilos =
    variante === "perigo"
      ? "bg-red-600 hover:bg-red-500"
      : "bg-gray-900 hover:bg-gray-800";

  return (
    <button
      type="submit"
      disabled={pending || desabilitado}
      className={`w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${estilos}`}
    >
      {pending ? carregandoTexto : children}
    </button>
  );
}
