import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
    BarChart3,
    ChevronRight,
    Database,
    Folder,
    FolderOpen,
    Image,
    LayoutTemplate,
    Newspaper,
    Palette,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function AdminSidebar() {
    const t = await getTranslations()

    const items = [
        { title: t('Asosiy malumotlar'), url: '/admin', icon: Database },
        {
            title: t('Sahifalar boshqaruvi'),
            url: '/admin/menus',
            icon: LayoutTemplate,
        },
        {
            title: t('Media'),
            url: '/admin/media',
            icon: Newspaper,
        },
        {
            title: t('Galereya'),
            url: '/admin/galereya',
            icon: Image,
        },
        {
            title: t('Statistika'),
            url: '/admin/statistika',
            icon: BarChart3,
        },
        {
            title: t('Fayl menejeri'),
            url: '/admin/fayllar',
            icon: FolderOpen,
        },
        {
            title: t('Dizayn'),
            url: '/admin/dizayn',
            icon: Palette,
        },
    ]

    return (
        <Sidebar className="border-r border-black/15 dark:border-white/15">
            <SidebarContent className="bg-[#0A0A3D] text-slate-300">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white mb-4 mt-2">
                        {t('Navigation Panel')}
                    </SidebarGroupLabel>

                    <SidebarGroupContent className="overflow-y-auto no-scrollbar">
                        <SidebarMenu className="gap-1 px-2 ">
                            {items?.map((item) => {
                                const ItemIcon = item.icon || Folder

                                return (
                                    <SidebarMenuItem key={item?.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                'group relative flex items-center justify-between transition-all duration-200 ease-in-out',
                                                'hover:bg-white/10 hover:text-white',
                                                'active:scale-[0.98] py-5'
                                            )}
                                        >
                                            <Link
                                                href={item.url}
                                                className="flex items-center w-full"
                                            >
                                                <div className="flex items-center gap-3 ">
                                                    <ItemIcon className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
                                                    <span className="text-[14px] font-medium tracking-tight ">
                                                        {item.title}
                                                    </span>
                                                </div>

                                                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
