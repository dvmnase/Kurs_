import React from 'react'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { useStateContext } from '../utils/context/StateContext'
import Layout from '../components/Layout'
import Image from 'next/image'
import chooseBySlug from '../utils/chooseBySlug'
import { getAllDataByType } from '../lib/cosmic'
import { authService } from '../services/authService'

import styles from '../styles/pages/NotFound.module.sass'
import { PageMeta } from '../components/Meta'

const AboutUs = ({ navigationItems, landing }) => {
  const { push } = useRouter()
  const userRole = authService.getRole()

  const handleClick = href => {
    push(href)
  }

  const infoAbout = chooseBySlug(landing, 'about')

  return (
    <Layout navigationPaths={!userRole ? {
      menu: [
        {
          title: 'Отзывы',
          url: '/#reviews',
        },
        {
          title: 'О нас',
          url: '/about',
        },
      ]
    } : navigationItems[0]?.metadata}>
      <PageMeta
        title={'О нас | Ремонт Про'}
        description={
          'Профессиональный ремонт квартир и домов. Качественные услуги по доступным ценам.'
        }
      />
      <div className={cn('section', styles.section)}>
        <div className={cn('container', styles.container)}>
          <div className={styles.wrap}>
            <div className={styles.heroWrapper}>
              <Image
                quality={60}
                layout="fill"
                src="/images/content/about.jpg"
                placeholder="blur"
                blurDataURL="/images/content/about.jpg"
                objectFit="cover"
                alt="О нашей компании"
                priority
              />
            </div>
            <h2 className={cn('h2', styles.title)}>
              О нашей компании
            </h2>
            <h3 className={styles.info}>Профессиональный ремонт квартир и домов</h3>
            <p className={styles.info}>
              Мы - команда профессионалов, специализирующаяся на качественном ремонте квартир и домов.
              Наша цель - сделать ваш дом уютным и комфортным, используя современные технологии и материалы.
              Мы предлагаем широкий спектр услуг по доступным ценам и гарантируем высокое качество работ.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AboutUs

export async function getServerSideProps() {
  const navigationItems = (await getAllDataByType('navigation')) || []
  const landing = (await getAllDataByType('landings')) || []

  return {
    props: { navigationItems, landing },
  }
}
