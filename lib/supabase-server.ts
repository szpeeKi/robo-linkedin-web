import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase pra usar em Server Components / rotas de servidor,
// respeitando o login da pessoa (RLS de "authenticated" se aplica normalmente).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrever cookie — pode ignorar,
            // o middleware já cuida de renovar a sessão nesse caso.
          }
        },
      },
    }
  );
}
