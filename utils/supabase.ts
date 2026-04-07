import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. " +
      "Verifique as variáveis de ambiente no .env (local) ou no painel do Netlify."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-my-custom-header": "pixel-perfect",
    },
  },
});

export default supabase;
