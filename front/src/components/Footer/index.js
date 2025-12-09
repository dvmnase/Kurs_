import React from 'react'
import cn from 'classnames'
import AppLink from '../AppLink'
import Group from './Group'
import Theme from '../Theme'
import Image from '../Image'
import SocialMedia from '../SocialMedia'

import styles from './Footer.module.sass'

const Footers = ({ navigation }) => {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={cn('container', styles.container)}>
        <div className={styles.row}>
          <div className={styles.col}>
            <div className={styles.logo}>
              <Image
                className={styles.pic}
                src="/images/logo.png"
                width={120}
                height={40}
                alt="Quantum Bank"
              />
            </div>
            <div className={styles.info}>
              Quantum Bank - Ваш надежный финансовый партнер. Мы предлагаем инновационные банковские решения для современного бизнеса.
            </div>
            <div className={styles.contacts}>
              <p>Телефон: +375 (29) 123-45-67</p>
              <p>Email: info@quantumbank.by</p>
              <p>Адрес: г. Минск, ул. Банковская, 1</p>
            </div>
          </div>
          <div className={styles.col}>
            <h3 className={styles.category}>Банковские услуги</h3>
            <AppLink href="/services#accounts">
              <p className={styles.text}>Открытие счетов</p>
            </AppLink>
            <AppLink href="/services#loans">
              <p className={styles.text}>Кредиты</p>
            </AppLink>
            <AppLink href="/services#cards">
              <p className={styles.text}>Банковские карты</p>
            </AppLink>
            <AppLink href="/services#investments">
              <p className={styles.text}>Инвестиции</p>
            </AppLink>
          </div>
          <div className={styles.col}>
            <h3 className={styles.category}>Информация</h3>
            <AppLink href="/about">
              <p className={styles.text}>О банке</p>
            </AppLink>
            <AppLink href="/news">
              <p className={styles.text}>Новости</p>
            </AppLink>
            <AppLink href="/career">
              <p className={styles.text}>Карьера</p>
            </AppLink>
            <AppLink href="/contacts">
              <p className={styles.text}>Контакты</p>
            </AppLink>
            <SocialMedia className={styles.social} />
          </div>
        </div>
        <div className={styles.foot}>
          <div className={styles.copyright}>
            © 2024 Quantum Bank. Все права защищены.
          </div>
          <div className={styles.note}>
            <AppLink href="/privacy">
              <span>Политика конфиденциальности</span>
            </AppLink>
            <AppLink href="/terms">
              <span>Условия использования</span>
            </AppLink>
      </div>
        </div>
      </div>
    </footer>
  )
}

export default Footers

