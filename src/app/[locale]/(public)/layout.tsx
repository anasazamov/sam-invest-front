import SnowAnimation from '@/components/animations/snow-animation'
import Chatbot from '@/components/chatbot/chatbot'
import Footer from '@/components/footer/footer'
import Header from '@/components/header/header'
import Postfooter from '@/components/postfooter/postfooter'
import Preheader from '@/components/preheader/preheader'
import Providers from '@/components/providers/providers'
import '../../globals.css'

export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <Providers>
            {/* <SnowAnimation /> */}
            <Preheader />
            <Header />
            {children}
            <Footer />
            <Postfooter />
            <Chatbot />
        </Providers>
    )
}
