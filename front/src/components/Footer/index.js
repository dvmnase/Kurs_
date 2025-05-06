import React, { useState } from 'react'
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
          <div className={styles.col} aria-hidden="true">
            <AppLink className={styles.logo} href="/">
              <Image
                size={{ width: '100px', height: '100px' }}
                className={styles.pic}
                src="/favicon/footlogo.png"
                srcDark={navigation['logo']?.imgix_url}
                alt="Logo"
                objectFit="cntain"
              />
            </AppLink>
            <div className={styles.info}>Выбирайте нас.</div>
            <div className={styles.version}>
              <div className={styles.details}>Dark theme</div>
              <Theme className="theme-big" />
            </div>
          </div>
          <div className={styles.col}>
            <Group className={styles.group} item={navigation?.['menu']} />
          </div>
          <div className={styles.col}>
            <AppLink href={`https://molnar.by/news/remont-v-kvartire-k-peremenam-v-zhizni/`}>
              <p className={styles.category}>О ремонте</p>
            </AppLink>
            <AppLink href={`https://www.houzz.ru/statyi/vtorichka-pravilynaya-posledovatelynosty-rabot-pri-remonte-kvartiry-stsetivw-vs~56925434`}>
              <p className={styles.text}>Теория</p>
            </AppLink>
            <AppLink href={`https://www.tiktok.com/foryou`}>
              <p className={styles.text}>Наши контакты</p>
            </AppLink>
            <SocialMedia className={styles.form} />
          </div>
        </div>
      </div>
      <div>
        <div className={styles.copyright} aria-hidden="true">
          <span className={styles.cosmicGroup}>
            <p className={styles.powered}>Powered by </p>
            <a href="https://www.youtube.com/watch?v=lqYKkloAWMc">
              <Image
                className={styles.cosmic}
                size={{ width: '50px', height: '90px' }}
                src="/favicon/favicon.png"
                alt="Cosmic Logo"
                objectFit="contain"
              />
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footers
