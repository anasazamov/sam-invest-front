'use client'

import { ArrowRight, Calculator } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'

export default function CalcCta() {
    const t = useTranslations('calc')
    const locale = useLocale()

    return (
        <section className="container-cs my-10">
            <div className="rounded-2xl bg-gradient-to-br from-[#0A0A3D] to-indigo-800 text-white p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 shadow-lg">
                <div className="grid place-items-center h-16 w-16 rounded-2xl bg-white/10 shrink-0">
                    <Calculator className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl md:text-2xl font-bold">
                        {t('homeCtaTitle')}
                    </h2>
                    <p className="text-blue-200/80 text-sm mt-1 max-w-2xl">
                        {t('homeCtaDesc')}
                    </p>
                </div>
                <Link
                    href={`/${locale}/calc`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0A0A3D] font-semibold px-6 py-3 hover:bg-blue-50 transition-colors shrink-0"
                >
                    {t('homeCtaBtn')}
                    <ArrowRight className="h-5 w-5" />
                </Link>
            </div>
        </section>
    )
}
