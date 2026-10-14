'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { useNavItems } from '@/components/header/use-nav-items'
import { pick } from '@/lib/blocks'
import { useSiteSettings } from '@/lib/site-settings'
import { resolveSocialLinks } from '@/lib/social-links'
import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Youtube,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import logo from '../../../public/logo.png'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

export function AppSidebar() {
  const t = useTranslations()
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const { setOpenMobile } = useSidebar()
  const locale = useLocale()
  const { data: site } = useSiteSettings()
  const customLogo = site?.logoDark || site?.logoLight
  const siteName = pick(site?.siteName, locale)

  const detailsData = useQuery({
    queryKey: ['details'],
    queryFn: async () => {
      const res = await api.get('/details')
      return res.data
    },
  })
  const social = resolveSocialLinks(detailsData.data)

  // Header bilan bir xil ro'yxat (admin → "Dizayn" → "Header")
  const menuItems = useNavItems()
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="bg-[#0A0A3D] pt-12 pb-6 px-6 border-b border-white/10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="relative  ">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customLogo}
                  alt={siteName || 'Logo'}
                  className="h-[90px] w-auto object-contain"
                />
              ) : (
                <Image
                  src={logo}
                  alt="Logo"
                  width={90}
                  height={90}
                  className="object-contain"
                />
              )}
            </div>
            {siteName ? (
              <h1 className="text-sm font-bold text-white text-center leading-tight tracking-wide">
                {siteName}
              </h1>
            ) : (
              <h1 className="text-sm font-bold text-white text-center leading-tight tracking-wide uppercase">
                Samarqand <br />
                <span className="text-blue-400 font-medium normal-case block mt-1 opacity-80">
                  Invest kompaniyasi
                </span>
              </h1>
            )}
          </Link>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="bg-[#0A0A3D] px-4 py-8 overflow-y-auto no-scrollbar hidden md:block">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <ContactCard
            icon={<Phone size={18} className="text-blue-400" />}
            label={t('Ishonch telefoni')}
            value={detailsData.data?.trustLinePhones || ''}
          />
          <ContactCard
            icon={<MessageSquare size={18} className="text-emerald-400" />}
            label={t('Devonxona')}
            value={detailsData.data?.receptionPhone || ''}
          />
          <div className="pt-2">
            <ContactCard
              icon={<Mail size={18} className="text-amber-400" />}
              label={t('Korporativ pochta')}
              value={detailsData.data?.corporateEmails || ''}
            />
          </div>
        </motion.div>
      </SidebarContent>
      <SidebarContent className="bg-[#0A0A3D] p-0 overflow-y-auto no-scrollbar md:hidden">
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {menuItems.map((menu, index) => {
                const hasDropdown =
                  Object.keys(menu.items).length > 1 || !menu.items['default']
                const isOpen = activeMenu === index

                return (
                  <li key={index} className="block">
                    {menu.items['default'] && !menu.hasSubMenu ? (
                      <Link
                        href={menu.items['default']}
                        className="flex items-center justify-between w-full px-4 py-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                        onClick={() => setOpenMobile(false)}
                      >
                        <span className="font-medium">{menu.title}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setActiveMenu(isOpen ? null : index)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                          isOpen
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium">{menu.title}</span>
                        {hasDropdown && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : 'opacity-50'
                            }`}
                          />
                        )}
                      </button>
                    )}

                    {hasDropdown && (
                      <div
                        className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen
                            ? 'grid-rows-[1fr] opacity-100 mt-1'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <ul className="overflow-hidden bg-black/20 rounded-lg mx-2">
                          {Object.entries(menu.items)
                            .filter(
                              ([key]) =>
                                key !== 'default' && key !== 'hasSubMenu'
                            )
                            .map(([label, path], itemIndex) => (
                              <li key={itemIndex}>
                                <Link
                                  href={path as any}
                                  onClick={() => {
                                    setOpenMobile(false)
                                    setActiveMenu(null)
                                  }}
                                  className="flex items-center gap-3 px-6 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-blue-500"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                  {label}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </SidebarContent>

      <SidebarFooter className="bg-[#0A0A3D] pb-10 px-6 border-t border-white/5">
        <p className="text-[10px] text-white/40 uppercase tracking-[2px] text-center mb-4">
          {t('Ijtimoiy tarmoqlar')}
        </p>
        {/* Havolalar admin → "Asosiy ma'lumotlar"dan (saqlanmagan bo'lsa — standart) */}
        <div className="flex justify-center gap-3">
          {social.telegram && (
            <SocialIcon icon={<Send size={18} />} color="hover:bg-sky-500" href={social.telegram} />
          )}
          {social.facebook && (
            <SocialIcon icon={<Facebook size={18} />} color="hover:bg-blue-600" href={social.facebook} />
          )}
          {social.instagram && (
            <SocialIcon icon={<Instagram size={18} />} color="hover:bg-pink-600" href={social.instagram} />
          )}
          {social.youtube && (
            <SocialIcon icon={<Youtube size={18} />} color="hover:bg-red-600" href={social.youtube} />
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | string[]
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 5 }}
      className="group flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default"
    >
      <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="pl-8">
        {Array.isArray(value) ? (
          value.map((v, i) => (
            <p
              key={i}
              className="text-[11px] text-white font-medium break-all mb-1 last:mb-0"
            >
              {v}
            </p>
          ))
        ) : (
          <p className="text-[11px] text-white font-medium ">{value}</p>
        )}
      </div>
    </motion.div>
  )
}

function SocialIcon({
  icon,
  color,
  href,
}: {
  icon: React.ReactNode
  color: string
  href: string
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -4, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white transition-all ${color}`}
    >
      {icon}
    </motion.a>
  )
}
