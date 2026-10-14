'use client'
import { pick } from '@/lib/blocks'
import { useSiteSettings } from '@/lib/site-settings'
import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageIcon, Mail, MapPin, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { LanguageSwitcher } from '../language-switcher/language-switcher'
import { ModeToggle } from '../mode-toggle/mode-toggle'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'

const Preheader = () => {
    const detailsData = useQuery({
        queryKey: ['details'],
        queryFn: async () => {
            const res = await api.get('/details')
            return res.data
        },
    })
    const [isOpen, setIsOpen] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const t = useTranslations()
    const locale = useLocale()
    const address =
        detailsData.data?.address?.[locale] ||
        detailsData.data?.address?.uz ||
        "Samarqand shahri, Ko‘ksaroy maydoni, 2-uy"
    const coords = detailsData.data?.mapCoords
    const lat = Number(coords?.lat) || 39.657179
    const lng = Number(coords?.lng) || 66.965423
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    // Admin → "Dizayn" → "Header"
    const { data: site } = useSiteSettings()
    const pre = site?.preheader
    const announcement = pick(pre?.text, locale)

    const updateFontSize = (size: string) => {
        document.documentElement.style.fontSize = size
    }

    const updateFilter = (filter: string) => {
        document.documentElement.style.filter = filter
    }

    const toggleImages = (show: boolean) => {
        const styleId = 'accessibility-hide-images'
        let styleTag = document.getElementById(styleId)
        if (!show) {
            if (!styleTag) {
                styleTag = document.createElement('style')
                styleTag.id = styleId
                styleTag.innerHTML = `
                    img, svg:not(.lucide), [style*="background-image"] {
                        visibility: hidden !important;
                    }
                `
                document.head.appendChild(styleTag)
            }
        } else {
            styleTag?.remove()
        }
    }

    return (
        <div className="hidden md:block py-4 relative">
            <div className="container-cs flex justify-between items-center">
                <SidebarTrigger />
                {pre?.showAddress !== false && (
                <div
                    className="relative"
                    onMouseEnter={() => setShowMap(true)}
                    onMouseLeave={() => setShowMap(false)}
                >
                    <h1 className="flex justify-center items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                        <MapPin size={16} />
                        <span className='md:hidden xl:block'>{address}</span>
                        <span className='hidden md:block xl:hidden'>{t('Manzil')}</span>
                    </h1>

                    <AnimatePresence>
                        {showMap && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                transition={{
                                    duration: 0.5,
                                    ease: 'easeInOut',
                                }}
                                className="absolute top-full left-0 mt-4 z-100 w-100 h-75 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800"
                            >
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    src={mapSrc}
                                    allowFullScreen
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                )}
                {announcement && (
                    <p
                        className="mx-4 min-w-0 flex-1 truncate text-center text-sm font-medium text-blue-600 dark:text-blue-400"
                        title={announcement}
                    >
                        {announcement}
                    </p>
                )}
                {pre?.showEmail !== false && detailsData.data?.infoEmails && (
                    <h1 className="flex justify-center items-center gap-2 md:hidden lg:flex">
                        <Mail size={16} /> {detailsData.data?.infoEmails}
                    </h1>
                )}
                <div className="flex gap-2">
                    <LanguageSwitcher />
                    <ModeToggle />
                    <Button
                        onClick={() => setIsOpen(!isOpen)}
                        className=""
                        variant="ghost"
                    >
                        {t('Maxsus imkoniyatlar')}
                    </Button>
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="absolute top-full left-0 z-55 bg-[#0A0A3D] text-white w-full py-4 border-t border-white/10"
                    >
                        <div className="container-cs flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm">
                                        {t('Shrift olchami')}:
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                updateFontSize('14px')
                                            }
                                            className="bg-white text-black px-3 py-1 rounded text-xs"
                                        >
                                            Aa
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateFontSize('16px')
                                            }
                                            className="bg-white text-black px-3 py-1 rounded text-sm"
                                        >
                                            Aa
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateFontSize('20px')
                                            }
                                            className="bg-white text-black px-3 py-1 rounded text-base font-bold"
                                        >
                                            Aa
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-l border-white/20 pl-8">
                                    <span className="text-sm">
                                        {t('Rang sxemasi')}:
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateFilter('none')}
                                            className="bg-white text-black px-3 py-1 rounded font-bold"
                                        >
                                            Aa
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateFilter('grayscale(100%)')
                                            }
                                            className="bg-black text-white px-3 py-1 rounded border border-white font-bold"
                                        >
                                            Aa
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateFilter(
                                                    'hue-rotate(180deg)'
                                                )
                                            }
                                            className="bg-[#EAB308] text-white px-3 py-1 rounded font-bold"
                                        >
                                            Aa
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-l border-white/20 pl-8">
                                    <span className="text-sm">
                                        {t('Tasvirlar')}:
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleImages(true)}
                                            className="bg-white text-black p-1 rounded"
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                        <button
                                            onClick={() => toggleImages(false)}
                                            className="bg-[#EAB308] text-white p-1 rounded"
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
export default Preheader
