import { useEffect } from 'react'
import { useRouter } from 'next/router'

const ScrollToSection = () => {
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            const hash = window.location.hash
            if (hash) {
                const element = document.querySelector(hash)
                if (element) {
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - 100
                    window.scrollTo(0, offsetPosition)
                }
            }
        }

        handleScroll()
        window.addEventListener('hashchange', handleScroll)

        return () => {
            window.removeEventListener('hashchange', handleScroll)
        }
    }, [router.asPath])

    return null
}

export default ScrollToSection
