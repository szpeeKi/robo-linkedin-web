"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const links = [
  { href: "/", label: "Fila de posts" },
  { href: "/novo", label: "Novo post" },
  { href: "/configuracoes", label: "Configurações" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            Posts do LinkedIn
          </span>
          <div className="flex flex-wrap gap-1">
            {links.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    ativo
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={sair}
          className="text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
