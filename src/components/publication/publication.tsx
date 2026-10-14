'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { api, baseBackendUrl } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import placeholderImage from '../../../public/image.png'
import { BreadcrumbSection } from '../breadcrumb-section/breadcrumb-section'
import { Button } from '../ui/button'

const PublicationExtended = () => {
  const locale = useLocale()
  const t = useTranslations()

  const [activeTab, setActiveTab] = useState(() => {
    return Cookies.get('publication-tab') || 'news'
  })

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ['publications', activeTab],
    queryFn: async () => {
      const response = await api.get('/publication')
      const filteredData = Array.isArray(response.data)
        ? response.data.filter(
            (item: any) => item.type?.toLowerCase() === activeTab.toLowerCase()
          )
        : []
      return filteredData.reverse()
    },
  })

  const cardsPerPage = 20
  const totalPages = Math.ceil(publications.length / cardsPerPage)
  const [currentPage, setCurrentPage] = useState(1)

  const startIndex = (currentPage - 1) * cardsPerPage
  const currentCards = publications.slice(startIndex, startIndex + cardsPerPage)

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
      <Image
        src={fullUrl}
        alt="publication"
        fill
        className={className}
        unoptimized
      />
    )
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    Cookies.set('publication-tab', tab)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (isLoading) return null

  const firstNews = currentCards[0]
  const otherNews = currentCards.slice(1)

  const tabs = [
    { label: t('Yangiliklar'), value: 'news' },
    { label: t('Tadbirlar'), value: 'events' },
    { label: t('Elonlar'), value: 'announcements' },
  ]

  return (
    <div className="container-cs py-5 mb-5">
      <div className="mb-8">
        <BreadcrumbSection
          prevPagesPaths={['/', '/publication']}
          prevPages={[t('Bosh sahifa'), t('Matbuot xizmati')]}
          currentPage={t(activeTab)}
        />
        <h1 className="mt-4 text-4xl font-black uppercase tracking-wider text-[#2B2B7A] dark:text-white">
          {t('Matbuot xizmati')}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          {t("So'nggi yangiliklar va rasmiy xabarlar")}
        </p>
      </div>

      <div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-[#0A0A3D] p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                onClick={() => handleTabChange(tab.value)}
                className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-white dark:bg-[#372AAC] dark:text-white text-[#2B2B7A] shadow-sm hover:bg-white'
                    : 'text-gray-700 dark:text-white hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {firstNews && (
            <div className="md:col-span-2 relative h-112.5">
              <Link href={`/publication/${firstNews.id}`}>
                <div className="absolute inset-0 bg-black/50 z-10 rounded-lg"></div>
                {renderMedia(firstNews.url?.[0], 'object-cover rounded-lg')}
              </Link>

              <div className="absolute bottom-5 left-5 right-5 text-white z-20 p-5">
                <p className="p-2 text-white bg-gray-200/30 w-fit rounded text-xs">
                  {firstNews.createdAt
                    ? new Date(firstNews.createdAt).toLocaleString(locale)
                    : ''}
                </p>
                <Link href={`/publication/${firstNews.id}`}>
                  <h1 className="font-bold text-2xl line-clamp-2 mt-2">
                    {getLocalizedValue(firstNews.title)}
                  </h1>
                </Link>
                <div
                  className="text-xl pt-2 line-clamp-2 text-white/90 **:bg-transparent! **:text-current!"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(getLocalizedValue(firstNews.content)),
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
                <Link href={`/${activeTab}/${item.id}`}>
                  {renderMedia(item.url?.[0], 'object-cover rounded-lg')}
                </Link>
              </div>

              <p className="py-3 text-[#76767A] text-sm">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString(locale)
                  : ''}
              </p>
              <Link href={`/publication/${item.id}`}>
                <h1 className="font-bold line-clamp-2">
                  {getLocalizedValue(item.title)}
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

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`cursor-pointer ${
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    if (
                      (page === currentPage - 2 && currentPage > 3) ||
                      (page === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )
                    }
                    return null
                  }
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`cursor-pointer ${
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicationExtended
