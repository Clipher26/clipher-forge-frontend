// frontend/config.ts
// Runtime config fetched from the backend's GET /api/config endpoint.

export interface ClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  hcaptchaSiteKey: string;
}

let cached: ClientConfig | null = null;
let fetchPromise: Promise<ClientConfig> | null = null;

export async function fetchConfig(): Promise<ClientConfig> {
  if (cached) return cached;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const fallback: ClientConfig = {
      supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || '',
      supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
      hcaptchaSiteKey: (import.meta as any).env?.VITE_HCAPTCHA_SITEKEY || '',
    };
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
      const data = await res.json();
      cached = {
        supabaseUrl: data.supabaseUrl || fallback.supabaseUrl,
        supabaseAnonKey: data.supabaseAnonKey || fallback.supabaseAnonKey,
        hcaptchaSiteKey: data.hcaptchaSiteKey || fallback.hcaptchaSiteKey || '',
      };
    } catch (e) {
      console.warn('[config] Using fallback config:', e);
      cached = fallback;
    }
    return cached!;
  })();

  return fetchPromise;
}

export function getConfig(): ClientConfig {
  if (cached) return cached;
  return {
    supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
    hcaptchaSiteKey: (import.meta as any).env?.VITE_HCAPTCHA_SITEKEY || '',
  };
}

export default { fetchConfig, getConfig };
