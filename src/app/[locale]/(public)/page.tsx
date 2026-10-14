import HomeSections from '@/components/home/home-sections'
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
        authors: [{ name: 'Samarqand Invest kompaniyasi' }],
        creator: 'Samarqand Invest Company',
        publisher: 'Samarqand Invest Company',
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
                    alt: 'Samarqand Invest Company',
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

// Seksiyalar tartibi va yoqilganligi admin → "Dizayn" → "Bosh sahifa"dan boshqariladi
export default function Home() {
    return <HomeSections />
}
