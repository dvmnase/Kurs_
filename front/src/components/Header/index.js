import React, { useState, useEffect, useCallback } from 'react'
import cn from 'classnames'
import AppLink from '../AppLink'
import Icon from '../Icon'
import Image from 'next/image'
import User from './User'
import Theme from '../Theme'
import Modal from '../Modal'
import { useStateContext } from '../../utils/context/StateContext'
import { getToken, removeToken } from '../../utils/token'
import SignInForm from '../auth/SignInForm'
import SignUpForm from '../auth/SignUpForm'
import { authService } from '../../services/authService'
import { useRouter } from 'next/router'

import styles from './Header.module.sass'

const Header = ({ navigation, showLogout, onLogout }) => {
  const [visibleNav, setVisibleNav] = useState(false)
  const [visibleAuthModal, setVisibleAuthModal] = useState(false)
  const [isLoginForm, setIsLoginForm] = useState(true)
  const router = useRouter()
  const userRole = authService.getRole()

  const { user, setUser } = useStateContext()

  useEffect(() => {
    let isMounted = true
    const localUser = getToken()
    if (isMounted && !user?.id && localUser?.id) {
      setUser(localUser)
    }

    return () => {
      isMounted = false
    }
  }, [user, setUser])

  const handleAuthSuccess = useCallback(() => {
    setVisibleAuthModal(false)
    if (userRole === 'USER') {
      router.push('/client')
    }
  }, [userRole, router])

  const toggleAuthForm = useCallback(() => {
    setIsLoginForm(prev => !prev)
  }, [])

  const handleLogoClick = (e) => {
    e.preventDefault()
    if (userRole === 'USER') {
      router.push('/client')
    } else {
      router.push('/')
    }
  }

  const defaultNavigation = userRole === 'USER' ? [
    {
      name: 'Личный каааабинет',
      path: '/client/personal-cabinet',
    },
    {
      name: 'Услуги',
      path: '/client/services',
    },
    {
      name: 'Поиск',
      path: '/client/services',
    },
    {
      name: 'Сотрудники',
      path: '/client/employees',
    },
    {
      name: 'Отзывы',
      path: '/client/reviews',
    },
  ] : [
    {
      name: 'Отзывы',
      path: '/#reviews',
    },
    {
      name: 'О нас',
      path: '/about',
    },
  ]

  const navItems = navigation || defaultNavigation

  return (
    <>
      <header className={styles.header}>
        <div className={cn('container', styles.container)} aria-hidden="true">
          <AppLink className={styles.logo} href={userRole === 'USER' ? '/client' : '/'} onClick={handleLogoClick}>
            <Image
              width={256}
              height={120}
              objectFit='contain'
              className={styles.pic}
              src="/favicon/favicon.png"
              alt="Logo"
              priority
            />
          </AppLink>
          <div className={cn(styles.wrapper, { [styles.active]: visibleNav })}>
            <nav className={styles.nav}>
              {Array.isArray(navItems) ? (
                navItems.map((item, index) => (
                  <AppLink
                    aria-label="navigation"
                    className={styles.link}
                    href={item?.path || '/'}
                    key={index}
                  >
                    {item.name}
                  </AppLink>
                ))
              ) : (
                navItems['menu']?.map((x, index) => (
                  <AppLink
                    aria-label="navigation"
                    className={styles.link}
                    href={x?.url || `/search`}
                    key={index}
                  >
                    {x.title}
                  </AppLink>
                ))
              )}
            </nav>
          </div>
          <div className={styles.version}>
            <Theme className="theme-big" />
          </div>
          {authService.isAuthenticated() && (
            <AppLink
              aria-label="search"
              aria-hidden="true"
              className={cn('button-small', styles.button)}
              href={`/client/search`}
            >
              <Icon name="search" size="20" />
              Поиск
            </AppLink>
          )}
          {showLogout ? (
            <button
              aria-label="logout"
              aria-hidden="true"
              className={cn('button-small', styles.button, styles.logout)}
              onClick={onLogout}
            >
              Выйти
            </button>
          ) : (
            <button
              aria-label="login"
              aria-hidden="true"
              className={cn('button-small', styles.button, styles.login)}
              onClick={() => setVisibleAuthModal(true)}
            >
              Войти
            </button>
          )}
          <button
            aria-label="user-information"
            aria-hidden="true"
            className={cn(styles.burger, { [styles.active]: visibleNav })}
            onClick={() => setVisibleNav(!visibleNav)}
          />
        </div>
      </header>

      <Modal
        visible={visibleAuthModal}
        onClose={() => setVisibleAuthModal(false)}
        outerClassName={styles.modal}
      >
        <div className={styles.steps}>
          <div className={styles.tabs}>
            <button
              className={cn(styles.tab, { [styles.active]: isLoginForm })}
              onClick={() => setIsLoginForm(true)}
            >
              Вход
            </button>
            <button
              className={cn(styles.tab, { [styles.active]: !isLoginForm })}
              onClick={() => setIsLoginForm(false)}
            >
              Регистрация
            </button>
          </div>
          <div className={styles.content}>
            {isLoginForm ? (
              <SignInForm onSuccess={handleAuthSuccess} />
            ) : (
              <SignUpForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setIsLoginForm(true)}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Header
