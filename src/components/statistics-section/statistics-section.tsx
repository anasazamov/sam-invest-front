'use client'

import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import { useLocale } from 'next-intl'
import { useRef } from 'react'
import { StatIcon } from './stat-icons'

interface StatItem {
    id: string
    value: string
    label: Record<string, string>
    icon?: string | null
}

const StatisticsSection = () => {
    const { data } = useQuery({
        queryKey: ['statistics'],
        queryFn: async () => {
            const res = await api.get('/statistic')
            return res.data as StatItem[]
        },
    })

    const stats = data ?? []
    if (stats.length === 0) return null
    // Animatsiyali qism ma'lumot kelgach o'rnatiladi: useInView kuzatuvni o'rnatish
    // paytida <section> DOM'da bo'lishi shart. Aks holda (ref null) kuzatuv hech
    // qachon boshlanmaydi va kartalar opacity:0 holatida qolib ketadi.
    return <StatisticsView stats={stats} />
}

function StatisticsView({ stats }: { stats: StatItem[] }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })
    const locale = useLocale()

    return (
        <section
            ref={ref}
            className="py-16 px-4 bg-[#0A0A3D] text-white relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-900 rounded-full filter blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={
                                isInView ? { opacity: 1, y: 0, scale: 1 } : {}
                            }
                            transition={{
                                duration: 0.6,
                                delay: index * 0.1,
                                ease: 'easeOut',
                                type: 'spring',
                                damping: 12,
                            }}
                            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 group"
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    whileHover={{ rotate: 360, scale: 1.2 }}
                                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                                    className="text-cyan-400 flex-shrink-0"
                                >
                                    <StatIcon name={stat.icon} index={index} />
                                </motion.div>
                                <div className="flex-1">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={
                                            isInView ? { scale: 1, opacity: 1 } : {}
                                        }
                                        transition={{
                                            delay: index * 0.1 + 0.2,
                                            duration: 0.5,
                                        }}
                                        className="text-3xl md:text-4xl font-bold mb-2 text-cyan-300"
                                    >
                                        {stat.value}
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={
                                            isInView ? { opacity: 1, x: 0 } : {}
                                        }
                                        transition={{
                                            delay: index * 0.1 + 0.3,
                                            duration: 0.5,
                                        }}
                                        className="text-sm md:text-base text-gray-300 leading-relaxed"
                                    >
                                        {stat.label?.[locale] || stat.label?.uz || ''}
                                    </motion.p>
                                </div>
                            </div>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={isInView ? { width: '100%' } : {}}
                                transition={{ delay: index * 0.1 + 0.4, duration: 0.8 }}
                                className="mt-4 h-1 bg-cyan-400 rounded-full"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default StatisticsSection
