'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const StatisticsSection = () => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    const stats = [
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h-2c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2h2v10z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 20H7V8a2 2 0 012-2h6v14z"
                    />
                </svg>
            ),
            value: '16',
            label: 'Yoshlar sanoat va tadbirkorlik zonalari',
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 21v-2a4 4 0 00-5-5H12M12 9a5 5 0 00-5 5v2M12 9a5 5 0 005 5v2M12 9a5 5 0 005 5v2"
                    />
                </svg>
            ),
            value: '90',
            label: 'Kichik sanoat zonalari',
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 12l-7 7-7-7"
                    />
                </svg>
            ),
            value: '25',
            label: 'Erkin iqtisodiy zonalar',
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-1a3 3 0 005.356-2.356L21 12a4.978 4.978 0 00-5-5h-2M9 7a3 3 0 003-3h6a3 3 0 003 3M9 17a3 3 0 003 3h6a3 3 0 003-3M9 12a3 3 0 003-3h6a3 3 0 003 3"
                    />
                </svg>
            ),
            value: '782',
            label: 'Investitsiya dasturi doirasida amalga oshirilayotgan loyihalar',
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            value: '1.9 mlrd $',
            label: '2021-yil yanvar-oktabr oylari uchun tovar aylanmasi',
        },
        {
            icon: (
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4L13 12"
                    />
                </svg>
            ),
            value: '218 mln. $',
            label: "2022-yil yanvar-noyabr oylarida o'zlashtirilgan xorijiy investitsiyalar",
        },
    ]

    return (
        <section
            ref={ref}
            className="py-16 px-4 bg-[#0A0A3D]  text-white relative overflow-hidden "
        >
            <div className="absolute top-0 left-0 w-full h-full opacity-20 ">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-900 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-900 rounded-full filter blur-3xl"></div>
            </div>

            <div className=" mx-auto max-w-7xl ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
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
                                    transition={{
                                        duration: 0.6,
                                        ease: 'easeInOut',
                                    }}
                                    className="text-cyan-400 flex-shrink-0"
                                >
                                    {stat.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={
                                            isInView
                                                ? { scale: 1, opacity: 1 }
                                                : {}
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
                                        {stat.label}
                                    </motion.p>
                                </div>
                            </div>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={isInView ? { width: '100%' } : {}}
                                transition={{
                                    delay: index * 0.1 + 0.4,
                                    duration: 0.8,
                                }}
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
