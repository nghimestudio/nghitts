/**
 * Config for i18n (non-Vietnamese) TTS pages.
 * - Local: models from public/tts-model/{lang}/
 * - Production: models from /api/model/piper/{lang}/
 */

export function getModelBaseUrl(lang) {
  if (import.meta.env.PROD) {
    return `/api/model/piper/${lang}/`;
  }
  return `${import.meta.env.BASE_URL}tts-model/${lang}/`;
}

/**
 * API URL to list models for a language.
 * Local: Vite middleware /api/piper/:lang/models
 * Production: Cloudflare /api/piper/:lang/models
 */
export function getModelsListUrl(lang) {
  return `/api/piper/${lang}/models`;
}

/** Default model names per language when no API is used (e.g. local fallback). */
export const DEFAULT_LANG_MODELS = {
  en: ['en_US-libritts_r-medium'],
  id: [],
};
