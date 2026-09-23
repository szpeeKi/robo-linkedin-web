import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Padrão é 1 MB, pequeno demais pra fotos de post — o formulário de
    // novo post manda a imagem escolhida direto numa Server Action.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
