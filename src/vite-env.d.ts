/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string // Make optional if not strictly required for local dev
  readonly VITE_SUPABASE_ANON_KEY?: string // Make optional
  readonly VITE_OPENWEATHER_API_KEY?: string // Make optional
  // sunoapi.org 連携用 APIキー
  readonly VITE_SUNOAPI_ORG_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}