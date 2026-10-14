'use client'

import { sanitizeHtml } from '@/lib/sanitize-html'
import { api, baseBackendUrl } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import placeholderImage from '../../../public/image.png'
import { Button } from '../ui/button'

const NewsSection = () => {
  const t = useTranslations()
  const locale = useLocale()

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ['publications', 'news-home'],
    queryFn: async () => {
      const response = await api.get('/publication')
      const filteredData = Array.isArray(response.data)
        ? response.data.filter(
            (item: any) => item.type?.toLowerCase() === 'news'
          )
        : []
      return filteredData.reverse().slice(0, 7)
    },
  })

  const getLocalizedValue = (obj: any) => {
    if (!obj) return ''
    return obj[locale] || obj['uz'] || obj['en'] || Object.values(obj)[0] || ''
  }

  const isVideo = (url: string) => {
    return url?.match(/\.(mp4|webm|ogg|mov)$/i)
  }

  const renderMedia = (urlPath: string | undefined, className: string) => {
    if (!urlPath) {
      return (
        <Image
          src={placeholderImage}
          alt="placeholder"
          fill
          className={className}
        />
      )
    }
    const fullUrl = `${baseBackendUrl}${urlPath}`
    if (isVideo(urlPath)) {
      return (
        <video
          src={fullUrl}
          className={className}
          muted
          loop
          autoPlay
          playsInline
        />
      )
    }
    return (
      <Image src={fullUrl} alt="news" fill className={className} unoptimized />
    )
  }

  const setNewsTab = () => {
    Cookies.set('publication-tab', 'news')
  }

  if (isLoading) return null

  const firstNews = publications[0]
  const otherNews = publications.slice(1)

  return (
    <div className="container-cs py-5 mb-5">
      <div>
        <div className="flex justify-between items-center pb-5">
          <h1 className="font-bold text-2xl mb-6 pb-2 border-b-2 border-[#2B2B7A] w-fit">
            {t('Yangiliklar')}
          </h1>
          <Button variant="ghost" onClick={setNewsTab} asChild>
            <Link href="/publication">{t('Barcha Yangiliklar')}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {firstNews && (
            <div className="md:col-span-2 relative h-112.5">
              <Link href={`/publication/${firstNews.id}`} onClick={setNewsTab}>
                <div className="absolute inset-0 bg-black/50 z-10 rounded-lg"></div>
                {renderMedia(firstNews.url?.[0], 'object-cover rounded-lg')}
              </Link>

              <div className="absolute bottom-5 left-5 right-5 text-white z-20 p-5">
                <p className="p-2 text-white bg-gray-200/30 w-fit rounded text-xs">
                  {firstNews.createdAt
                    ? new Date(firstNews.createdAt).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',

                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: false,
                      })
                    : ''}
                </p>
                <Link
                  href={`/publication/${firstNews.id}`}
                  onClick={setNewsTab}
                >
                  <h1 className="font-bold text-2xl line-clamp-2 mt-2">
                    {getLocalizedValue(firstNews.title) ||
                      t('Sarlavha mavjud emas')}
                  </h1>
                </Link>
                <div
                  className="text-xl pt-2 line-clamp-2 text-white/90 **:bg-transparent! **:text-current!"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      getLocalizedValue(firstNews.content) !== '<p></p>'
                        ? getLocalizedValue(firstNews.content)
                        : t('Tavsif mavjud emas')
                    ),
                  }}
                />
              </div>
            </div>
          )}

          {otherNews.map((item: any, index: number) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                type: 'spring',
                stiffness: 300,
              }}
              className="flex flex-col"
              whileHover={{ scale: 1.02 }}
            >
              <div className="aspect-video w-full overflow-hidden bg-gray-200 rounded-lg relative">
                <Link href={`/publication/${item.id}`} onClick={setNewsTab}>
                  {renderMedia(item.url?.[0], 'object-cover rounded-lg')}
                </Link>
              </div>

              <p className="py-3 text-[#76767A] text-sm">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString(locale, {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',

                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: false,
                    })
                  : ''}
              </p>
              <Link href={`/publication/${item.id}`} onClick={setNewsTab}>
                <h1 className="font-bold line-clamp-2">
                  {getLocalizedValue(item.title) || t('Sarlavha mavjud emas')}
                </h1>
              </Link>

              <div
                className="pt-2 overflow-hidden display-webkit-box webkit-line-clamp-5 webkit-box-orient-vertical text-lg wrap-anywhere text-foreground/80 **:bg-transparent! **:text-current!"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    getLocalizedValue(item.content) !== '<p></p>'
                      ? getLocalizedValue(item.content)
                      : t('Tavsif mavjud emas')
                  ),
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewsSection
