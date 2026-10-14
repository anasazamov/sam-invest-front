import axios from 'axios'
import createMiddleware from 'next-intl/middleware'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { baseBackendUrl } from './models/axios'

// i18n middleware
const intlMiddleware = createMiddleware(routing)

// private route ro‘yxati
const protectedRoutes = ['/admin']

// Auth middleware — /admin faqat yaroqli token bilan ochiladi (barcha muhitda).
export async function proxy(req: NextRequest) {
  const cookiesStore = await cookies()
  const res = intlMiddleware(req)
  const token = req.cookies.get('saminvest-token')?.value

  const pathname = req.nextUrl.pathname
  const segments = pathname.split('/').filter(Boolean)
  const routePath = '/' + (segments[1] || '')

  if (!cookiesStore.get('intl-locale')?.value) {
    cookiesStore.set('intl-locale', 'uz')
  }

  const locale = segments[0] || routing.defaultLocale
  const loginUrl = new URL(`/${locale}/login`, req.url)
  const matchedRoute = protectedRoutes.find((r) => routePath.startsWith(r))

  if (matchedRoute) {
    // Token umuman yo'q — darhol login sahifasiga
    if (!token) {
      return NextResponse.redirect(loginUrl)
    }

    // Token bor — backendda tekshiramiz (imzo + muddat + foydalanuvchi mavjudligi)
    try {
      const meRes = await axios.get(`${baseBackendUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      })

      if (meRes.status !== 200 && meRes.status !== 201) {
        return NextResponse.redirect(loginUrl)
      }

      cookiesStore.set('saminvest-me', JSON.stringify(meRes.data))
    } catch {
      return NextResponse.redirect(loginUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
}
