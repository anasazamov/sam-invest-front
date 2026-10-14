import { supportedLanguages } from '@/lib/utils'

export type ContentLang = 'uz' | 'oz' | 'ru' | 'en' | 'all'

export type LocalizedContent = Partial<Record<ContentLang, string>>

/**
 * Sahifa kontentini joriy til uchun hal qiladi.
 * - Yangi format: { uz, oz, ru, en, all? } — Json.
 * - Eski format: oddiy string (migratsiyadan oldingi ma'lumot) — uz deb olinadi.
 * `all` bo'lsa (barcha tillar uchun umumiy qism) — tildan qat'i nazar qo'shiladi.
 */
export function resolveContent(content: unknown, locale: string): string {
  if (!content) return ''
  if (typeof content === 'string') return content // eski format

  const c = content as LocalizedContent
  const localized = c[locale as ContentLang] ?? c.uz ?? ''
  const all = c.all ?? ''

  if (all && localized) return `${localized}\n\n${all}`
  return localized || all || ''
}

/** Qaysi tillar (uz/oz/ru/en) to'ldirilmaganini qaytaradi — admin ko'rsatkichi uchun. */
export function emptyContentLangs(content: unknown): string[] {
  const langs = supportedLanguages // ['uz','oz','ru','en']

  if (!content) return [...langs]
  if (typeof content === 'string') {
    // eski string — faqat uz to'ldirilgan hisoblanadi
    return content.trim() ? langs.filter((l) => l !== 'uz') : [...langs]
  }

  const c = content as LocalizedContent
  return langs.filter((l) => !(c[l as ContentLang] && String(c[l as ContentLang]).trim()))
}
