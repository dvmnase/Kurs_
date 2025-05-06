import React, { useState } from 'react'
import cn from 'classnames'
import styles from './Card.module.sass'
import Icon from '../Icon'
import Image from 'next/image'
import { authService } from '../../services/authService'
import Modal from '../Modal'

const Card = ({ className, item }) => {
  const [showModal, setShowModal] = useState(false)
  const isLoggedIn = authService.isAuthenticated()

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const handleCloseModal = (e) => {
    e?.stopPropagation()
    e?.preventDefault()
    setShowModal(false)
  }

  const handleModalClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const imageUrl = item?.metadata?.image?.imgix_url || '/images/content/mainPict.png'
  const blurDataUrl = imageUrl !== '/images/content/mainPict.png'
    ? `${imageUrl}?auto=format,compress&q=1&blur=500&w=2`
    : undefined

  return (
    <>
      <div className={cn(styles.card, className)}>
        <div className={styles.link} onClick={handleClick}>
          <div className={styles.preview}>
            <Image
              quality={60}
              className={styles.image}
              width={360}
              height={360}
              src={imageUrl}
              placeholder={blurDataUrl ? "blur" : "empty"}
              blurDataURL={blurDataUrl}
              objectFit="cover"
              alt={item?.title || "Service"}
            />
            <div className={styles.control}>
              <div className={styles.category}>{item?.title}</div>
              <button
                className={cn('button-small', styles.button)}
                onClick={(e) => e.stopPropagation()}
              >
                <span>Услуга</span>
                <Icon name="scatter-up" size="16" />
              </button>
            </div>
          </div>
          <div className={styles.foot}>
            <div className={styles.status}>
              <p>{item?.title}</p>
            </div>
            <span className={styles.price}>{`₽ ${item?.metadata?.price || 0}`}</span>
          </div>
        </div>
      </div>

      <Modal
        visible={showModal}
        onClose={handleCloseModal}
        outerClassName={styles.modal}
      >
        <div className={styles.modalContent} onClick={handleModalClick}>
          <div className={styles.modalHeader}>
            <h2>{item?.title}</h2>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalImage}>
              <Image
                src={imageUrl}
                alt={item?.title || "Service"}
                width={600}
                height={300}
                objectFit="cover"
                objectPosition="center"
                quality={100}
                placeholder={blurDataUrl ? "blur" : "empty"}
                blurDataURL={blurDataUrl}
              />
            </div>
            <div className={styles.modalInfo}>
              <p className={styles.modalDescription}>{item?.metadata?.description || 'Описание услуги отсутствует'}</p>
              <div className={styles.modalPrice}>{`Цена: ₽ ${item?.metadata?.price || 0}`}</div>
              {isLoggedIn && (
                <button
                  className={cn('button', styles.orderButton)}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    handleCloseModal()
                  }}
                >
                  Заказать
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Card
