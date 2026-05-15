import React from 'react'
import cn from 'classnames'
import AppLink from '../AppLink'
import SocialMedia from '../SocialMedia'

import styles from './Footer.module.sass'

const footerLinks = [
  { title: 'Мои грузы', href: '/owner/cargo', icon: '1' },
  { title: 'Заявки', href: '/owner/requests', icon: '2' },
  { title: 'Чаты', href: '/owner/chats', icon: '3' },
  { title: 'Настройки', href: '/owner/settings', icon: '4' },
]

const stats = [
  { value: '24/7', label: 'контроль заявок' },
  { value: '3 мин', label: 'на создание груза' },
  { value: '100%', label: 'прозрачность маршрута' },
]

const benefits = [
  'Быстрое создание и редактирование грузов',
  'Удобная работа с перевозчиками и заявками',
  'Маршруты, статусы и переписка в одном месте',
]

const Footers = () => {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={cn('container', styles.container)}>
        <div className={styles.top}>
          <div className={styles.brandWrap}>
            <div className={styles.brand}>
              <span className={styles.brandBadge}>HT</span>
              <div>
                <strong>HeatTruck</strong>
                <small>умная логистика грузов</small>
              </div>
            </div>
          </div>

          <p className={styles.lead}>
            HeatTruck помогает управлять грузами, заявками, перевозчиками и маршрутами в одном
            аккуратном рабочем пространстве — без хаоса в переписках и таблицах.
          </p>
        </div>

        <div className={styles.stats}>
          {stats.map((item) => (
            <div className={styles.statItem} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          <section className={cn(styles.panel, styles.aboutPanel)}>
            <div className={styles.panelHead}>
              <span className={styles.kicker}>О сервисе</span>
              <h3>Грузоперевозки становятся проще</h3>
            </div>

            <p>
              Мы объединяем владельцев грузов и перевозчиков: создавайте грузы, принимайте заявки,
              отслеживайте маршруты и контролируйте статусы без лишней переписки.
            </p>

            <div className={styles.benefits}>
              {benefits.map((item) => (
                <div className={styles.benefit} key={item}>
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>

            <div className={styles.videoBlock}>
              <div className={styles.videoCaption}>
                <span>Видео о логистике</span>
                <strong>Как выглядит современная грузовая инфраструктура</strong>
              </div>

              <div className={styles.videoFrame}>
                <iframe
                  src="https://www.youtube.com/embed/oW257zA7aUo?modestbranding=1&rel=0&controls=1"
                  title="Container Terminal and Cargo Logistics"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

          <section className={cn(styles.panel, styles.sidePanel)}>
            <div className={styles.panelHead}>
              <span className={styles.kicker}>Быстрый доступ</span>
              <h3>Навигация</h3>
            </div>

            <nav className={styles.navLinks}>
              {footerLinks.map((link) => (
                <AppLink href={link.href} key={link.href}>
                  <span className={styles.linkIcon}>{link.icon}</span>
                  <span>{link.title}</span>
                </AppLink>
              ))}
            </nav>

            <div className={styles.contacts}>
              <div className={styles.panelHead}>
                <span className={styles.kicker}>Связаться с нами</span>
                <h3>Контакты</h3>
              </div>

              <div className={styles.contactList}>
                <p>
                  <span>☎</span>
                  <a href="tel:+375295557788">+375 (29) 555-77-88</a>
                </p>
                <p>
                  <span>✉</span>
                  <a href="mailto:info@heattruck.by">info@heattruck.by</a>
                </p>
                <p>
                  <span>⌖</span>
                  Минск, пр-т Независимости, 95, офис 312
                </p>
              </div>
            </div>

            <div className={styles.socialBox}>
              <span>Мы в соцсетях</span>
              <SocialMedia className={styles.social} />
            </div>
          </section>
        </div>

        <div className={styles.foot}>
          <div className={styles.copyright}>© 2026 HeatTruck. Все права защищены.</div>

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
