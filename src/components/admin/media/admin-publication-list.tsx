'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useState } from 'react'

import { sanitizeHtml } from '@/lib/sanitize-html'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { api, baseBackendUrl } from '@/models/axios'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import placeholderImage from '../../../../public/image.png'

const AdminPublicationList = ({
    activeTab,
    setEditingItem,
}: {
    activeTab: string
    setEditingItem: Dispatch<SetStateAction<Record<string, any> | null>>
}) => {
    const locale = useLocale()
    const queryClient = useQueryClient()
    const cardsPerPage = 20
    const [currentPage, setCurrentPage] = useState<number>(1)
    const t = useTranslations()

    const { data: publications = [], isLoading } = useQuery({
        queryKey: ['publications', activeTab],
        queryFn: async () => {
            const response = await api.get('/publication')
            const filteredData = Array.isArray(response.data)
                ? response.data.filter(
                      (item: any) =>
                          item.type?.toLowerCase() === activeTab?.toLowerCase()
                  )
                : []

            return filteredData.reverse()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/publication/delete/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['publications', activeTab],
            })
        },
    })

    const totalCards = publications.length
    const totalPages = Math.ceil(totalCards / cardsPerPage)
    const startIndex = (currentPage - 1) * cardsPerPage
    const endIndex = startIndex + cardsPerPage
    const currentCards = publications.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const getLocalizedValue = (obj: any) => {
        if (!obj) return ''
        return (
            obj[locale] || obj['uz'] || obj['en'] || Object.values(obj)[0] || ''
        )
    }

    const getImageUrl = (urlPath: string | undefined) => {
        if (!urlPath) return placeholderImage
        return `${baseBackendUrl}${urlPath}`
    }

    const isVideo = (url: string | undefined) => {
        if (!url) return false
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
        return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext))
    }

    if (isLoading)
        return <div className="text-center py-10">{t('Yuklanmoqda')}...</div>

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {startIndex === 0 && currentCards[0] && (
                    <div className="md:col-span-2 relative h-112.5">
                        <div className="absolute top-2 right-2 z-50 justify-center items-center gap-2 flex">
                            <Button
                                onClick={() => {
                                    setEditingItem(currentCards[0])
                                }}
                                className="z-50 cursor-pointer"
                                size={'icon'}
                            >
                                <Edit />
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        size={'icon'}
                                        variant="destructive"
                                        className="z-50 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Trash2 />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DialogTitle className="hidden"></DialogTitle>
                                    <p className="mb-4">
                                        Rostdan o‘chirmoqchimisiz?
                                    </p>
                                    <div className="flex gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    deleteMutation.mutate(
                                                        currentCards[0].id
                                                    )
                                                }
                                            >
                                                Ha, o‘chirish
                                            </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button variant="outline">
                                                Bekor qilish
                                            </Button>
                                        </DialogClose>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Link href={`/admin/media/${currentCards[0].id}`}>
                            <div className="absolute inset-0 bg-black/50 z-10 rounded-lg"></div>
                            {isVideo(currentCards[0].url?.[0]) ? (
                                <video
                                    src={
                                        getImageUrl(
                                            currentCards[0].url?.[0]
                                        ) as string
                                    }
                                    className="w-full h-full object-cover rounded-lg"
                                    muted
                                    loop
                                    autoPlay
                                />
                            ) : (
                                <Image
                                    src={getImageUrl(currentCards[0].url?.[0])}
                                    fill
                                    alt={
                                        getLocalizedValue(
                                            currentCards[0].title
                                        ) || t('Sarlavha mavjud emas')
                                    }
                                    unoptimized={
                                        process.env.NODE_ENV === 'development'
                                    }
                                    className="object-cover rounded-lg"
                                />
                            )}
                        </Link>
                        <div className="absolute bottom-5 left-5 right-5 text-white z-20 p-5">
                            <p className="p-2 text-white bg-gray-200/30 w-fit rounded text-xs">
                                {currentCards[0].createdAt
                                    ? new Date(
                                          currentCards[0].createdAt
                                      ).toLocaleString(locale, {
                                          year: 'numeric',
                                          month: 'numeric',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: 'numeric',
                                          hour12: false,
                                      })
                                    : '---'}
                            </p>
                            <Link href={`/admin/media/${currentCards[0].id}`}>
                                <h1 className="font-bold text-2xl line-clamp-2 mt-2">
                                    {getLocalizedValue(currentCards[0].title) ||
                                        t('Sarlavha mavjud emas')}
                                </h1>
                            </Link>
                            <div
                                className="pt-2 line-clamp-3 text-sm **:bg-transparent! **:text-current! text-white wrap-anywhere"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(
                                        getLocalizedValue(
                                            currentCards[0].content
                                        ) !== '<p></p>'
                                            ? getLocalizedValue(
                                                  currentCards[0].content
                                              )
                                            : t('Tavsif mavjud emas')
                                    ),
                                }}
                            />
                        </div>
                    </div>
                )}

                {currentCards.map((item: any, index: number) => {
                    if (startIndex === 0 && index === 0) return null

                    return (
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
                            className="flex flex-col relative"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="absolute top-2 right-2 z-50 flex justify-center items-center gap-2">
                                <Button
                                    className="z-50 cursor-pointer"
                                    size={'icon'}
                                    onClick={() => setEditingItem(item)}
                                >
                                    <Edit />
                                </Button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="z-50 cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                            size={'icon'}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <p className="mb-4">
                                            Rostdan o‘chirmoqchimisiz?
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    deleteMutation.mutate(
                                                        item.id
                                                    )
                                                }
                                            >
                                                Ha, o‘chirish
                                            </Button>
                                            <DialogClose asChild>
                                                <Button variant="outline">
                                                    Bekor qilish
                                                </Button>
                                            </DialogClose>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="aspect-video w-full overflow-hidden bg-gray-200 rounded-lg relative">
                                <Link href={`/admin/media/${item.id}`}>
                                    {isVideo(item.url?.[0]) ? (
                                        <video
                                            src={
                                                getImageUrl(
                                                    item.url?.[0]
                                                ) as string
                                            }
                                            className="w-full h-full object-cover rounded"
                                            muted
                                        />
                                    ) : (
                                        <Image
                                            src={getImageUrl(item.url?.[0])}
                                            alt="news"
                                            fill
                                            unoptimized={
                                                process.env.NODE_ENV ===
                                                'development'
                                            }
                                            className="object-cover rounded"
                                        />
                                    )}
                                </Link>
                            </div>
                            <p className="pt-2 text-[#76767A] text-sm">
                                {item.createdAt
                                    ? new Date(item.createdAt).toLocaleString(
                                          locale,
                                          {
                                              year: 'numeric',
                                              month: 'numeric',
                                              day: 'numeric',
                                              hour: 'numeric',
                                              minute: 'numeric',
                                              hour12: false,
                                          }
                                      )
                                    : '---'}
                            </p>
                            <Link href={`/admin/media/${item.id}`}>
                                <h2 className="font-bold text-lg mt-1 line-clamp-2">
                                    {getLocalizedValue(item.title) ||
                                        t('Sarlavha mavjud emas')}
                                </h2>
                            </Link>
                            <div
                                className="pt-2 line-clamp-3 text-sm **:bg-transparent! **:text-current! text-foreground/80 wrap-anywhere"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(
                                        getLocalizedValue(item.content) !==
                                            '<p></p>'
                                            ? getLocalizedValue(item.content)
                                            : t('Tavsif mavjud emas')
                                    ),
                                }}
                            />
                        </motion.div>
                    )
                })}
            </div>

            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    className={`cursor-pointer ${
                                        currentPage === 1
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }`}
                                />
                            </PaginationItem>

                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map((page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 &&
                                        page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() =>
                                                    handlePageChange(page)
                                                }
                                                isActive={page === currentPage}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                }
                                if (
                                    (page === currentPage - 2 &&
                                        currentPage > 3) ||
                                    (page === currentPage + 2 &&
                                        currentPage < totalPages - 2)
                                ) {
                                    return (
                                        <PaginationItem
                                            key={`ellipsis-${page}`}
                                        >
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )
                                }
                                return null
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
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
    )
}

export default AdminPublicationList
