import Announcements from '@/components/announcements/announcements'
import CalcCta from '@/components/calc/calc-cta'
import Events from '@/components/events/events'
import HeroSection from '@/components/hero-section/hero-section'
import NewsSection from '@/components/news-section/news-section'
import StatisticsSection from '@/components/statistics-section/statistics-section'
import UsefulLinks from '@/components/useful-links/useful-links'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale })

    const title = t('Samarqand viloyati Investitsiyalar sanoat va savdo boshqarmasi')
    const description = t(
        'Samarqand viloyatida investitsiyalarni jalb qilish, sanoatni rivojlantirish va savdo faoliyatini qo‘llab-quvvatlash — Saminvest Company rasmiy portali'
    )
    const keywords = [
        'samarqand invest kompaniyasi',
        'saminvest kompaniyasi',
        'samarqand investitsiya',
        'samarqand viloyati investitsiyalar',
        'saminvestcompany.uz',
        'инвестиционная компания Самарканд',
        'Саминвест компанияси',
        'Samarkand investment company',
        'Samarqand industrial zones',
        'Samarqand free economic zones',
        'Samarqand business support',
        'Samarqand trade and industry',
        'Samarqand investment projects',
        'Samarqand youth entrepreneurship',
        'Samarqand small industrial zones',
        'Samarqand foreign investments',
        'Samarqand statistics',
        'Samarqand announcements',
        'Samarqand events',
    ]

    const canonicalBase = 'https://saminvestcompany.uz'
    const canonicalUrl = locale === 'uz' ? canonicalBase : `${canonicalBase}/${locale}`

    return {
        title,
        description,
        keywords,
        authors: [{ name: 'Samarqand Viloyati Investitsiya, Sanoat va Savdo Boshqarmasi' }],
        creator: 'Saminvest Company',
        publisher: 'Samarqand Regional Administration',
        alternates: {
            canonical: canonicalUrl,
            languages: {
                uz: 'https://saminvestcompany.uz/uz',
                ru: 'https://saminvestcompany.uz/ru',
                en: 'https://saminvestcompany.uz/en',
            },
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'Saminvest Company — Samarqand Investment Portal',
            locale,
            type: 'website',
            images: [
                {
                    url: 'https://saminvestcompany.uz/og-image.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Saminvest Company — Samarqand Investment, Industry and Trade Department',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['https://saminvestcompany.uz/og-image.jpg'],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: 'index, follow',
        },
        formatDetection: {
            telephone: false,
        },
        metadataBase: new URL('https://saminvestcompany.uz'),
    }
}

export default function Home() {
    return (
        <div>
            <HeroSection />
            <CalcCta />
            <NewsSection />
            <StatisticsSection />
            <Announcements />
            <Events />
            <UsefulLinks />
        </div>
    )
}
