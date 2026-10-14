import { Inter, Montserrat, Noto_Sans, Roboto } from 'next/font/google'

import BrandStyle from '@/components/providers/brand-style'
import ReactQueryProvider from '@/components/providers/react-query-provider'
import ToastifyProvider from '@/components/providers/toastify-provider'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext'],
  display: 'swap',
})

// Admin "Dizayn" bo'limida tanlanadigan muqobil shriftlar (oldindan yuklanmaydi)
const roboto = Roboto({
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  display: 'swap',
  preload: false,
})
const montserrat = Montserrat({
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  display: 'swap',
  preload: false,
})
const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  display: 'swap',
  preload: false,
})

const defaultTheme: string = 'light'

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const locale = await getLocale()

  return (
    <html
      className={`${defaultTheme} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${notoSans.variable}`}
      style={{ colorScheme: defaultTheme }}
      suppressHydrationWarning
      lang={locale}
    >
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider>
          <ReactQueryProvider>
            <BrandStyle />
            <ToastifyProvider />
            {children}
          </ReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export default Layout
