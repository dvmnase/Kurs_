import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ClientLayout from '../../components/client/ClientLayout';
import styles from '../../styles/client/ServiceDetails.module.sass';
import authService from '../../services/authService';

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    photo?: string;
}

const ServiceView = () => {
    const router = useRouter();
    const { id } = router.query;
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;

            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Требуется авторизация');
                }

                const response = await fetch(`http://localhost:8080/user/services/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при загрузке услуги');
                }

                const data = await response.json();
                setService(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Произошла ошибка');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id]);

    if (loading) {
        return (
            <ClientLayout>
                <Head>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </ClientLayout>
        );
    }

    if (error || !service) {
        return (
            <ClientLayout>
                <Head>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className={styles.container}>
                    <div className={styles.error}>{error || 'Услуга не найдена'}</div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <Head>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.container}>
                <div className={styles.serviceDetails}>
                    <div className={styles.imageContainer}>
                        {service.photo ? (
                            <img
                                src={`data:image/jpeg;base64,${service.photo}`}
                                alt={service.name}
                                className={styles.serviceImage}
                            />
                        ) : (
                            <div className={styles.noImage}>Нет изображения</div>
                        )}
                    </div>
                    <div className={styles.infoContainer}>
                        <h1 className={styles.title}>{service.name}</h1>
                        <p className={styles.description}>{service.description}</p>
                        <div className={styles.price}>
                            {service.price} ₽
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ServiceView;