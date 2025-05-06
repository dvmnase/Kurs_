import React from 'react'
import cn from 'classnames'
import { useRouter } from 'next/router'
import Image from 'next/image'

import styles from './Description.module.sass'

const Description = ({ info }) => {
  const { push } = useRouter()

  const handleClick = href => {
    if (href === '#services') {
      const servicesSection = document.getElementById('services')
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
    else if (href === '#footer') {
      const servicesSection = document.getElementById('footer')
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      push(href)
    }
  }

  return (
    <div className={styles.section}>
      <div className={cn('container', styles.container)}>
        <div className={styles.wrap}>
          <div className={styles.stage}>ПРОФЕССИОНАЛЬНЫЙ РЕМОНТ</div>
          <h1 className={cn('h1', styles.title)}>РЕМОНТ ПРО</h1>
          <div className={styles.text}>Найдите лучших мастеров для ремонта вашего дома. Быстро, качественно и по доступным ценам.</div>
          <div className={styles.btns}>
            <button
              aria-hidden="true"
              onClick={() => handleClick('#footer')}
              className={cn('button-stroke', styles.button)}
            >
              Наши контакты
            </button>
            <button
              aria-hidden="true"
              onClick={() => handleClick('#services')}
              className={cn('button', styles.button)}
            >
              Наши услуги
            </button>
          </div>
        </div>
        <div className={styles.gallery}>
          <div className={styles.heroWrapper}>
            <Image
              quality={60}
              className={styles.preview}
              layout="fill"
              src="/images/content/mainPict.png"
              placeholder="blur"
              blurDataURL="/images/content/mainPict.png"
              objectFit="cover"
              alt="Team"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Description
