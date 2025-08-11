/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROVIDER: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_ANTHROPIC_API_KEY: string
  readonly VITE_ANTHROPIC_MODEL: string
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_AZURE_OPENAI_DEPLOYMENT: string
  readonly VITE_LLM_MAX_TOKENS: string
  readonly VITE_LLM_TEMPERATURE: string
  readonly VITE_LLM_TIMEOUT_MS: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}