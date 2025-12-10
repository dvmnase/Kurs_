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
          
            <div className={styles.info}>
            HeatTruck — ваш надежный партнёр в сфере грузоперевозок.
            Мы предоставляем профессиональные услуги по доставке грузов любого типа и объёма. Наша команда обеспечивает полную безопасность на каждом этапе транспортировки и строгий контроль сроков. Мы работаем быстро, аккуратно и ответственно, чтобы ваш груз всегда прибывал вовремя и в идеальном состоянии.</div>
            <img
              src="/images/girlyanda-footer.png"
              alt="Banner"
              className={styles.bannerImage}
            />
            <div className={styles.videoContainer}>
              <iframe
                src="https://www.youtube.com/embed/cyJGnV-vrdo?modestbranding=1&rel=0&showinfo=0&controls=1"
                title="HeatTruck Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.video}
              ></iframe>
            </div>
          </div>
          <div className={styles.col}>
            <div className={styles.navSection}>
              <h3 className={styles.category}>Услуги</h3>
              <nav className={styles.navLinks}>
                <AppLink href="/owner/cargo">
                  <p className={styles.text}>Мои грузы</p>
                </AppLink>
                <AppLink href="/owner/requests">
                  <p className={styles.text}>Заявки</p>
                </AppLink>
                <AppLink href="/owner/chats">
                  <p className={styles.text}>Чаты</p>
                </AppLink>
                <AppLink href="/owner/settings">
                  <p className={styles.text}>Настройки</p>
                </AppLink>
              </nav>
              <div className={styles.contacts}>
                <h3 className={styles.category}>Контакты</h3>
                <p>Телефон: +375 (29) 555-77-88</p>
                <p>Email: info@heattruck.by</p>
                <p>Адрес: г. Минск, пр-т Независимости, 95, офис 312</p>
              </div>
              <SocialMedia className={styles.social} />
            </div>
          </div>
        </div>
        <div className={styles.foot}>
          <div className={styles.copyright}>
            © 2025 HeatTruck. Все права защищены.
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

