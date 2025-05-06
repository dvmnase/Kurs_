import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Header from '../Header'
import Footer from '../Footer'
import { useStateContext } from '../../utils/context/StateContext'
import ScrollToSection from '../ScrollToSection'

import styles from './Layout.module.sass'
import { Meta, PageMeta } from '../Meta'

const Layout = ({ children, title, navigationPaths, showLogout, onLogout }) => {
  const { navigation, setNavigation } = useStateContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!navigation?.hasOwnProperty('menu') && navigationPaths?.hasOwnProperty('menu')) {
      setNavigation(navigationPaths)
    }
  }, [navigation, navigationPaths, setNavigation])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  // Преобразуем navigation в правильный формат
  const getNavigation = () => {
    const nav = navigationPaths || navigation
    if (Array.isArray(nav)) {
      return nav
    }
    if (nav?.menu) {
      return nav.menu.map(item => ({
        name: item.title,
        path: item.url
      }))
    }
    return []
  }

  return (
    <>
      <Meta />
      <PageMeta title="remontPro" />
      <ScrollToSection />
      <div className={styles.page}>
        <Header
          navigation={getNavigation()}
          showLogout={showLogout}
          onLogout={onLogout}
        />
        <main className={styles.inner}>{children}</main>
        <Footer navigation={getNavigation()} />
      </div>
    </>
  )
}

export default Layout
