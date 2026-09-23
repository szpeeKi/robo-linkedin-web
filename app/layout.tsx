import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Posts do LinkedIn",
  description: "Painel interno de agendamento de posts do LinkedIn",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
