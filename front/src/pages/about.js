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
          title: 'Главная страница',
          url: '/#reviews',
        },
        {
          title: 'О нас',
          url: '/about',
        },
      ]
    } : navigationItems[0]?.metadata}>
      <PageMeta
        title={'О нас | Quantum Bank'}
        description={
          'Quantum Bank - Ваш надежный финансовый партнер. Инновационные банковские решения для современного бизнеса.'
        }
      />
      <div className={cn('section', styles.section)}>
        <div className={cn('container', styles.container)}>
          <div className={styles.wrap}>
            <div className={styles.heroWrapper}>
              <Image
                quality={60}
                layout="fill"
                src="/images/content/about.png"
                placeholder="blur"
                blurDataURL="/images/content/about.png"
                objectFit="cover"
                alt="О Quantum Bank"
                priority
              />
            </div>
            <h2 className={cn('h2', styles.title)}>
              О Quantum Bank
            </h2>
            <h3 className={styles.info}>Инновационный банк будущего</h3>
            <p className={styles.info}>
              Quantum Bank - это современный финансовый институт, который сочетает в себе традиционные банковские ценности с инновационными технологиями. Мы стремимся предоставлять нашим клиентам передовые финансовые решения, обеспечивая при этом высочайший уровень безопасности и надежности.
            </p>
            <p className={styles.info}>
              Наша миссия - сделать банковские услуги доступными, удобными и эффективными для каждого клиента. Мы постоянно развиваемся и внедряем новые технологии, чтобы обеспечить вам лучший банковский опыт.
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
