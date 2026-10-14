'use client'

import { useSiteSettings } from '@/lib/site-settings'
import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'

export interface NavItem {
    title: string
    hasSubMenu: boolean
    items: Record<string, string> // { default: '/path', 'Sarlavha': '/path/sub', ... }
}

/**
 * Header va mobil sidebar uchun umumiy menyu ro'yxati.
 * Admin → "Dizayn" → "Header": doimiy bandlar va yashirilgan menyular;
 * qoralama (DRAFT) sahifalar ko'rsatilmaydi.
 */
export function useNavItems(): NavItem[] {
    const t = useTranslations()
    const locale = useLocale()
    const { data: site } = useSiteSettings()
    const header = site?.header
    const hidden = new Set(header?.hiddenMenus ?? [])

    const menus = useQuery({
        queryKey: ['menus'],
        queryFn: async () => {
            const res = await api.get('/menu')
            return res.data
        },
    })

    const dynamic: NavItem[] = (menus.data ?? [])
        .filter((menu: any) => !hidden.has(menu.id))
        .map((menu: any) => ({
            title: menu.name?.[locale] || menu.name?.uz || t('Nomalum'),
            hasSubMenu: true,
            items: {
                default: `/${menu.slug}`,
                ...(menu.submenus
                    ?.filter((submenu: any) => submenu.status !== 'DRAFT')
                    .reduce((acc: Record<string, string>, submenu: any) => {
                        const title = submenu.name?.[locale] || submenu.name?.uz || t('Nomalum')
                        acc[title] = `/${menu.slug}/${submenu.slug}`
                        return acc
                    }, {}) || {}),
            },
        }))

    return [
        ...(header?.showHome !== false
            ? [{ title: t('Bosh sahifa'), items: { default: '/' }, hasSubMenu: false }]
            : []),
        ...dynamic,
        ...(header?.showCalc !== false
            ? [{ title: t('Kalkulyator'), items: { default: '/calc' }, hasSubMenu: false }]
            : []),
        ...(header?.showPress !== false
            ? [
                  {
                      title: t('Matbuot'),
                      items: {
                          default: '',
                          Foto: '/galereya/rasmlar',
                          Video: '/galereya/videolar',
                      },
                      hasSubMenu: true,
                  },
              ]
            : []),
    ]
}
