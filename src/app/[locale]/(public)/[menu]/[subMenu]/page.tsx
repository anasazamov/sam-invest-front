'use client'

import '@/app/globals.css' // agar global style bo'lsa
import BlockRenderer from '@/components/blocks/block-renderer'
import { parseBlocks } from '@/lib/blocks'
import { resolveContent } from '@/lib/localized-content'
import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { useParams, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

const Page = () => {
  const { menu, subMenu, locale } = useParams()
  const searchParams = useSearchParams()
  const currentLocale = Array.isArray(locale) ? locale[0] : locale || 'uz'
  // Admin qoralamani ko'rishi uchun: ?preview=1 + token cookie
  const isPreview =
    searchParams.get('preview') === '1' && !!Cookies.get('saminvest-token')

  const pageData = useQuery({
    queryKey: ['page', menu, subMenu],
    queryFn: async () => {
      const res = await api.get(`/sub-menu/slug/${subMenu}`)
      return res.data
    },
    enabled: !!subMenu,
  })

  if (pageData.isLoading) {
    return (
      <div className="container-cs">
        <p>Yuklanmoqda...</p>
      </div>
    )
  }

  if (pageData.isError || !pageData.data) {
    return (
      <div className="container-cs">
        <p>Xatolik yuz berdi yoki sahifa topilmadi.</p>
      </div>
    )
  }

  // Qoralama sahifa oddiy foydalanuvchiga ko'rinmaydi (preview rejimidan tashqari)
  if (pageData.data.status === 'DRAFT' && !isPreview) {
    return (
      <div className="container-cs py-20 text-center">
        <p className="text-lg text-slate-600">Xatolik yuz berdi yoki sahifa topilmadi.</p>
      </div>
    )
  }

  const blocks = parseBlocks(pageData.data.blocks)
  const content = resolveContent(pageData.data.content, currentLocale)

  const draftBanner = pageData.data.status === 'DRAFT' && isPreview && (
    <div className="bg-amber-100 text-amber-800 text-center text-sm py-2 font-medium">
      👁️ Qoralama rejimi — bu sahifa hali e'lon qilinmagan
    </div>
  )

  // Vizual konstruktor bloklari bo'lsa — shundan chizamiz
  if (blocks.length > 0) {
    return (
      <div>
        {draftBanner}
        <BlockRenderer blocks={blocks} locale={currentLocale} />
      </div>
    )
  }

  // Aks holda — eski markdown kontent
  return (
    <div>
      {draftBanner}
    <div className="container-cs py-10">
      <article className="prose prose-lg lg:prose-xl mx-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            img: ({ node, ...props }) => (
              <img
                {...props}
                alt={props.alt || 'Rasm'}
                className="max-w-full h-auto rounded-lg shadow-md my-6"
              />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-8">
                <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-100">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-6 py-4 align-top whitespace-normal break-words text-sm text-gray-900">
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
    </div>
  )
}

export default Page
