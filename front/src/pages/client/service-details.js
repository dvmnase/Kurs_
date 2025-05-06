import React from 'react'
import { useRouter } from 'next/router'
import ClientLayout from '../../components/client/ClientLayout.tsx'
import styles from '../../styles/client/ServiceDetails.module.sass'

const ServiceDetails = () => {
    const router = useRouter()
    const { id, name, description, price, photo } = router.query

    if (!id) {
        return (
            <ClientLayout>
                <div className={styles.container}>
                    <div className={styles.error}>Услуга не найдена</div>
                </div>
            </ClientLayout>
        )
    }

    return (
        <ClientLayout>
            <div className={styles.container}>
                <div className={styles.serviceDetails}>
                    <div className={styles.imageContainer}>
                        {photo ? (
                            <img
                                src={`data:image/jpeg;base64,${photo}`}
                                alt={name}
                                className={styles.serviceImage}
                            />
                        ) : (
                            <div className={styles.noImage}>Нет изображения</div>
                        )}
                    </div>
                    <div className={styles.infoContainer}>
                        <h1 className={styles.title}>{name}</h1>
                        <p className={styles.description}>{description}</p>
                        <div className={styles.price}>
                            {price} ₽
                        </div>
                        <button
                            className={styles.orderButton}
                            onClick={() => {/* Здесь будет логика создания заказа */ }}
                        >
                            Заказать
                        </button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    )
}

export default ServiceDetails 