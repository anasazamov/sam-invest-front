'use client'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useNotify from '@/hooks/use-notify'
import { resolveSocialLinks } from '@/lib/social-links'
import { api } from '@/models/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Asterisk, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const LANGUAGES = [
    { key: 'uz', label: "O'zbekcha" },
    { key: 'oz', label: 'Ўзбекча' },
    { key: 'ru', label: 'Русский' },
    { key: 'en', label: 'English' },
] as const

type Localized = { uz: string; oz: string; ru: string; en: string }
type SocialLinks = {
    telegram: string
    facebook: string
    instagram: string
    youtube: string
}

type FormValues = {
    receptionPhone: string
    infoEmails: string
    trustLinePhones: string[]
    corporateEmails: string[]
    workingHours: Localized
    address: Localized
    socialLinks: SocialLinks
    mapCoords: { lat: string; lng: string }
}

const SOCIALS: { key: keyof SocialLinks; label: string; ph: string }[] = [
    { key: 'telegram', label: 'Telegram', ph: 'https://t.me/...' },
    { key: 'facebook', label: 'Facebook', ph: 'https://facebook.com/...' },
    { key: 'instagram', label: 'Instagram', ph: 'https://instagram.com/...' },
    { key: 'youtube', label: 'YouTube', ph: 'https://youtube.com/...' },
]

const MainDetails = () => {
    const { toastSuccess, toastError } = useNotify()
    const t = useTranslations()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<FormValues>({
        receptionPhone: '',
        infoEmails: '',
        trustLinePhones: [''],
        corporateEmails: [''],
        workingHours: { uz: '', oz: '', ru: '', en: '' },
        address: { uz: '', oz: '', ru: '', en: '' },
        socialLinks: { telegram: '', facebook: '', instagram: '', youtube: '' },
        mapCoords: { lat: '', lng: '' },
    })

    const details = useQuery({
        queryKey: ['details'],
        queryFn: async () => {
            const res = await api.get<FormValues & { id: string }>('/details')
            return res.data
        },
    })

    const updateDetails = useMutation({
        mutationFn: async (data: FormValues) => {
            return api.patch('/details', data)
        },
        onSuccess: () => {
            toastSuccess(t('Details updated successfully'))
            queryClient.invalidateQueries({ queryKey: ['details'] })
        },
        onError: () => {
            toastError(t('Failed to update details'))
        }
    })

    useEffect(() => {
        if (details.data) {
            setFormData({
                receptionPhone: String(details.data.receptionPhone || ''),
                infoEmails: String(details.data.infoEmails || ''),
                trustLinePhones: details.data.trustLinePhones?.length
                    ? details.data.trustLinePhones.map(p => String(p))
                    : [''],
                corporateEmails: details.data.corporateEmails?.length
                    ? details.data.corporateEmails.map(e => String(e))
                    : [''],
                workingHours: {
                    uz: String(details.data.workingHours?.uz || ''),
                    oz: String(details.data.workingHours?.oz || ''),
                    ru: String(details.data.workingHours?.ru || ''),
                    en: String(details.data.workingHours?.en || ''),
                },
                address: {
                    uz: String(details.data.address?.uz || ''),
                    oz: String(details.data.address?.oz || ''),
                    ru: String(details.data.address?.ru || ''),
                    en: String(details.data.address?.en || ''),
                },
                // Saqlanmagan bo'lsa — saytda ko'rinayotgan standart havolalar
                socialLinks: resolveSocialLinks(details.data),
                mapCoords: {
                    lat: String((details.data as any).mapCoords?.lat ?? ''),
                    lng: String((details.data as any).mapCoords?.lng ?? ''),
                },
            })
        }
    }, [details.data])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateDetails.mutate(formData)
    }

    const handleInputChange = (field: keyof FormValues, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleWorkingHoursChange = (lang: keyof FormValues['workingHours'], value: string) => {
        setFormData(prev => ({
            ...prev,
            workingHours: { ...prev.workingHours, [lang]: value }
        }))
    }

    const handleAddressChange = (lang: keyof Localized, value: string) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [lang]: value }
        }))
    }

    const handleSocialChange = (key: keyof SocialLinks, value: string) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [key]: value }
        }))
    }

    const handleMapChange = (key: 'lat' | 'lng', value: string) => {
        setFormData(prev => ({
            ...prev,
            mapCoords: { ...prev.mapCoords, [key]: value }
        }))
    }

    const handleArrayChange = (field: 'trustLinePhones' | 'corporateEmails', index: number, value: string) => {
        setFormData(prev => {
            const newArray = [...prev[field]]
            newArray[index] = value
            return { ...prev, [field]: newArray }
        })
    }

    const addArrayItem = (field: 'trustLinePhones' | 'corporateEmails') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }))
    }

    const removeArrayItem = (field: 'trustLinePhones' | 'corporateEmails', index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }))
    }

    if (details.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#372AAC]" />
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="container-cs py-10 space-y-6"
        >
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('General Settings')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('Manage contact details and working schedule')}
                    </p>
                </div>
                <Button
                    type="submit"
                    disabled={updateDetails.isPending}
                    className="bg-[#372AAC] px-10 h-11 text-white"
                >
                    {updateDetails.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {t('Update Details')}
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Card className="row-span-2">
                    <CardHeader>
                        <CardTitle>{t('Contact Channels')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="pb-2">
                                {t('Reception Phone')}{' '}
                                <Asterisk className="inline w-3 h-3 text-red-500" />
                            </Label>
                            <Input
                                value={formData.receptionPhone}
                                onChange={(e) => handleInputChange('receptionPhone', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label className="pb-2">
                                {t('Info Email')}{' '}
                                <Asterisk className="inline w-3 h-3 text-red-500" />
                            </Label>
                            <Input
                                value={formData.infoEmails}
                                onChange={(e) => handleInputChange('infoEmails', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex justify-between flex-row items-center">
                        <CardTitle>{t('Trust Line Phones')}</CardTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => addArrayItem('trustLinePhones')}
                        >
                            <Plus className="w-4 h-4 mr-1" /> {t('Add')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {formData.trustLinePhones.map((phone, idx) => (
                            <div key={idx}>
                                <div className="flex gap-2">
                                    <Input
                                        value={phone}
                                        onChange={(e) => handleArrayChange('trustLinePhones', idx, e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeArrayItem('trustLinePhones', idx)}
                                    >
                                        <Trash2 className="text-red-500 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader className="flex justify-between flex-row items-center">
                        <CardTitle>{t('Corporate Emails')}</CardTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => addArrayItem('corporateEmails')}
                        >
                            <Plus className="w-4 h-4 mr-1" /> {t('Add')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {formData.corporateEmails.map((email, idx) => (
                            <div key={idx}>
                                <div className="flex gap-2">
                                    <Input
                                        value={email}
                                        onChange={(e) => handleArrayChange('corporateEmails', idx, e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeArrayItem('corporateEmails', idx)}
                                    >
                                        <Trash2 className="text-red-500 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t('Working Hours')}</CardTitle>
                        <CardDescription>{t('All languages are required')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="uz">
                            <TabsList>
                                {LANGUAGES.map((l) => (
                                    <TabsTrigger key={l.key} value={l.key}>
                                        {l.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {LANGUAGES.map((l) => (
                                <TabsContent key={l.key} value={l.key}>
                                    <Input
                                        value={formData.workingHours[l.key]}
                                        onChange={(e) => handleWorkingHoursChange(l.key, e.target.value)}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t('Manzil')}</CardTitle>
                        <CardDescription>{t('All languages are required')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="uz">
                            <TabsList>
                                {LANGUAGES.map((l) => (
                                    <TabsTrigger key={l.key} value={l.key}>
                                        {l.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {LANGUAGES.map((l) => (
                                <TabsContent key={l.key} value={l.key}>
                                    <Input
                                        value={formData.address[l.key]}
                                        onChange={(e) => handleAddressChange(l.key, e.target.value)}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t('Ijtimoiy tarmoqlar')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SOCIALS.map((s) => (
                            <div key={s.key}>
                                <Label className="pb-2">{s.label}</Label>
                                <Input
                                    value={formData.socialLinks[s.key]}
                                    placeholder={s.ph}
                                    onChange={(e) => handleSocialChange(s.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>{t('Xarita koordinatalari')}</CardTitle>
                        <CardDescription>
                            {t('Xaritada koʻrsatiladigan nuqta (kenglik va uzunlik)')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="pb-2">Latitude (lat)</Label>
                            <Input
                                value={formData.mapCoords.lat}
                                placeholder="39.657179"
                                onChange={(e) => handleMapChange('lat', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="pb-2">Longitude (lng)</Label>
                            <Input
                                value={formData.mapCoords.lng}
                                placeholder="66.965423"
                                onChange={(e) => handleMapChange('lng', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}

export default MainDetails
