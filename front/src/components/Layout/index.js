import React, { useEffect, useState } from 'react'
import Header from '../Header'
import Footer from '../Footer'
import { useStateContext } from '../../utils/context/StateContext'
import ScrollToSection from '../ScrollToSection'

import styles from './Layout.module.sass'
import { Meta, PageMeta } from '../Meta'

const Layout = ({
  children,
  title = '',
  navigationPaths = {},
  showLogout = false,
  onLogout = () => { },
}) => {
  const context = useStateContext() || {}

  const {
    navigation = {},
    setNavigation = () => { },
  } = context

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (
      !navigation?.hasOwnProperty?.('menu') &&
      navigationPaths?.hasOwnProperty?.('menu')
    ) {
      setNavigation(navigationPaths)
    }
  }, [navigation, navigationPaths, setNavigation])

  const getNavigation = () => {
    const nav = navigationPaths?.menu ? navigationPaths : navigation

    if (Array.isArray(nav)) {
      return nav
    }

    if (nav?.menu && Array.isArray(nav.menu)) {
      return nav.menu.map((item) => ({
        name: item.title,
        path: item.url,
      }))
    }

    return []
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <Meta />
      <PageMeta title={title || 'HeatTruck'} />
      <ScrollToSection />

      <div className={styles.page}>
        <Header
          navigation={getNavigation()}
          showLogout={showLogout}
          onLogout={onLogout}
        />

        <div className={styles.banner}>
          <img
            src="/images/girlyanda.png"
            alt="Гирлянда"
            className={styles.bannerImage}
          />
        </div>

        <main className={styles.inner}>{children}</main>

        <Footer navigation={getNavigation()} />
      </div>
    </>
  )
}

export default Layout