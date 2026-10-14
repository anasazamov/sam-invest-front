import { MetadataRoute } from 'next'
import { api } from '@/models/axios'

const baseUrl = 'https://saminvestcompany.uz'
const locales = ['uz', 'oz', 'ru', 'en'] as const

// Sayt marshrutlari har doim til prefiksi bilan (/uz/...) — prefikssiz manzil
// /uz/... ga yo'naltiriladi, sitemap'da esa yakuniy manzil bo'lishi kerak.
const staticRoutes = ['', '/publication', '/galereya/rasmlar', '/galereya/videolar', '/calc']

// Build vaqtida backend bo'lmasligi mumkin — soatiga bir yangilanadi (ISR)
export const revalidate = 3600

type Entry = { path: string; lastModified?: Date; changeFrequency: 'weekly' | 'monthly'; priority: number }

async function getDynamicEntries(): Promise<Entry[]> {
  const out: Entry[] = []
  const [pubs, menus] = await Promise.allSettled([api.get('/publication'), api.get('/menu')])

  if (pubs.status === 'fulfilled' && Array.isArray(pubs.value.data)) {
    for (const p of pubs.value.data) {
      if (!p?.id) continue
      out.push({
        path: `/publication/${p.id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } else {
    console.warn('sitemap: nashrlar olinmadi')
  }

  if (menus.status === 'fulfilled' && Array.isArray(menus.value.data)) {
    for (const m of menus.value.data) {
      for (const s of m?.submenus ?? []) {
        if (!m?.slug || !s?.slug || s.status === 'DRAFT') continue // qoralamalar kirmaydi
        out.push({
          path: `/${m.slug}/${s.slug}`,
          lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }
  } else {
    console.warn('sitemap: menyular olinmadi')
  }
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: Entry[] = [
    ...staticRoutes.map((path) => ({
      path,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1.0 : 0.8,
    })),
    ...(await getDynamicEntries()),
  ]

  return entries.flatMap((e) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${e.path}`,
      lastModified: e.lastModified ?? new Date(),
      changeFrequency: e.changeFrequency,
      priority: e.priority,
      // Har til versiyasi qolganlariga bog'lanadi (hreflang)
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${e.path}`])),
      },
    }))
  )
}
