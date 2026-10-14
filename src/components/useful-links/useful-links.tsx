'use client'

import { pick } from '@/lib/blocks'
import { useSiteSettings } from '@/lib/site-settings'
import { useLocale, useTranslations } from 'next-intl'
import 'swiper/css'
import 'swiper/css/scrollbar'
import { A11y, Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

// Admin "Dizayn" → "Foydali havolalar" bo'sh bo'lsa ishlatiladigan standart ro'yxat
const DEFAULT_LINKS = [
    { title: "Lex.uz", url: 'https://www.lex.uz/uz/' },
    { title: "Huquqiyportal.uz", url: 'https://www.huquqiyportal.uz/' },
    { title: 'Data.gov.uz', url: 'http://data.gov.uz/' },
    { title: 'Parliament.gov.uz', url: 'https://parliament.gov.uz/' },
    { title: "President.uz", url: 'https://president.uz/uz' },
    { title: 'Gov.uz', url: 'https://gov.uz/oz' },
].map((l) => ({ ...l, logo: `/${l.title.toLowerCase()}.png` }))

const UsefulLinks = () => {
    const t = useTranslations()
    const locale = useLocale()
    const { data } = useSiteSettings()
    const custom = (data?.usefulLinks ?? []).filter((l) => l.url)
    const links = custom.length
        ? custom.map((l) => ({ title: pick(l.title, locale) || l.url, url: l.url, logo: l.logo }))
        : DEFAULT_LINKS
    return (
        <div className="container-cs py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-2xl pb-2 border-b-2 border-[#2B2B7A] w-fit">
                    {t("Foydali havolalar")}
                </h2>
            </div>

            <Swiper
                modules={[A11y, Autoplay]}
                slidesPerView={1}
                spaceBetween={20}
                breakpoints={{
                    480: { slidesPerView: 2 },
                    768: { slidesPerView: 3, spaceBetween: 24 },
                    1024: { slidesPerView: 4, spaceBetween: 24 },
                    1280: { slidesPerView: 5, spaceBetween: 30 },
                }}
                autoplay={{ delay: 4000, pauseOnMouseEnter: true }}
                loop
                className="useful-links-swiper pb-12!"
            >
                {links.map((link, index) => {
                    return (
                        <SwiperSlide key={index}>
                            <a
                                href={link.url}
                                className="group block h-full text-center"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="relative flex flex-col items-center gap-4 p-6 h-full bg-white dark:bg-[#232351] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-[#2B2B7A]/20 group-hover:-translate-y-1">
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                                        {link.logo && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={link.logo}
                                                alt={link.title}
                                                className="h-full w-full object-contain p-2"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm md:text-base text-gray-800 dark:text-gray-100 group-hover:text-[#2B2B7A] transition-colors">
                                            {link.title}
                                        </p>
                                        <div className="h-0.5 w-0 group-hover:w-full bg-[#2B2B7A] mx-auto transition-all duration-300" />
                                    </div>

                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            className="text-[#2B2B7A]"
                                        >
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15 3 21 3 21 9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        </SwiperSlide>
                    )
                })}
            </Swiper>
        </div>
    )
}

export default UsefulLinks
