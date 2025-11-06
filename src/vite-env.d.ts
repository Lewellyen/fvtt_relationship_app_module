/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_ENABLE_PERF_TRACKING?: string;
  readonly VITE_PERF_SAMPLING_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
