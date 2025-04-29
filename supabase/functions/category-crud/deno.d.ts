declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }

  const env: Env;
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(
    handler: (request: Request) => Promise<Response> | Response,
    options?: {
      port?: number;
      hostname?: string;
    }
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(
    supabaseUrl: string, 
    supabaseKey: string, 
    options?: any
  ): any;
} 