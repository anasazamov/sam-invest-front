'use client'

import { pick } from '@/lib/blocks'
import { useSiteSettings } from '@/lib/site-settings'
import { useLocale, useTranslations } from 'next-intl'

const Postfooter = () => {
    const t = useTranslations()
    const locale = useLocale()
    const { data } = useSiteSettings()
    const text = pick(data?.copyright, locale) || t('Barcha huquqlar himoyalangan')

    return (
        <div className="bg-[#0A0A3D] border-t border-white/5 py-6">
            <div className="container-cs px-4">
                <p className="text-center text-white">
                    &copy; {new Date().getFullYear()} {text}.
                </p>
            </div>
        </div>
    )
}

export default Postfooter
