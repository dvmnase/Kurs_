import React, { useState, useEffect } from 'react'
import cn from 'classnames'
import Slider from 'react-slick'
import Icon from '../Icon'
import Card from '../Card'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'

import styles from './HotBid.module.sass'

const SlickArrow = ({ currentSlide, slideCount, children, ...props }) => (
  <button aria-label="arrow" aria-hidden="true" {...props}>
    {children}
  </button>
)

const settings = {
  infinite: true,
  speed: 700,
  slidesToShow: 4,
  slidesToScroll: 1,
  nextArrow: (
    <SlickArrow>
      <Icon name="arrow-next" size="14" />
    </SlickArrow>
  ),
  prevArrow: (
    <SlickArrow>
      <Icon name="arrow-prev" size="14" />
    </SlickArrow>
  ),
  responsive: [
    {
      breakpoint: 1179,
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 1023,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 2,
        infinite: true,
      },
    },
  ],
}

const Hot = ({ classSection }) => {
  const router = useRouter()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:8080/user/services', {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Ошибка при загрузке услуг')
        }

        const data = await response.json()
        setServices(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleServiceClick = (service) => {
    router.push({
      pathname: '/client/service-details',
      query: {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        photo: service.photo
      }
    })
  }

  const handleViewAll = () => {
    router.push('/client/services')
  }

  if (loading) {
    return (
      <div id="services" className={cn(classSection, styles.section)}>
        <div className={cn('container', styles.container)}>
          <div className={styles.wrapper}>
            <h2 className={cn('h3', styles.title)}>Наши услуги</h2>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div id="services" className={cn(classSection, styles.section)}>
        <div className={cn('container', styles.container)}>
          <div className={styles.wrapper}>
            <h2 className={cn('h3', styles.title)}>Наши услуги</h2>
            <div className={styles.error}>{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="services" className={cn(classSection, styles.section)}>
      <div className={cn('container', styles.container)}>
        <div className={styles.wrapper}>
          <h2 className={cn('h3', styles.title)}>Наши услуги</h2>
          <div className={styles.inner}>
            <Slider className="bid-slider" {...settings}>
              {services.map((service) => (
                <div key={service.id} onClick={() => handleServiceClick(service)}>
                  <Card className={styles.card} item={{
                    id: service.id,
                    title: service.name,
                    metadata: {
                      image: {
                        imgix_url: service.photo ? `data:image/jpeg;base64,${service.photo}` : '/images/services/default.jpg'
                      },
                      price: service.price,
                      description: service.description,
                      categories: [{ title: 'Услуга' }],
                    }
                  }} />
                </div>
              ))}
            </Slider>
          </div>
          <button className={cn('button', styles.viewAllButton)} onClick={handleViewAll}>
            Просмотреть все услуги
          </button>
        </div>
      </div>
    </div>
  )
}

export default Hot
