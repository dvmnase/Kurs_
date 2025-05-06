import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ClientLayout from '../../components/client/ClientLayout';
import { authService } from '../../services/authService';
import styles from '../../styles/client/ServiceDetails.module.sass';

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    photo?: string;
}

const ServiceDetails = () => {
    const router = useRouter();
    const { id } = router.query;
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
    }, []);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;

            try {
                const response = await fetch(`http://localhost:8080/user/services/${id}`, {
                    headers: {
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

    const handleOrder = async () => {
        if (!isAuthenticated) {
            router.push('/auth/signin');
            return;
        }

        try {
            const token = authService.getToken();
            const response = await fetch('http://localhost:8080/user/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serviceId: service?.id
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании заказа');
            }

            router.push('/client/orders');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при создании заказа');
        }
    };

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
                        {isAuthenticated && (
                            <button
                                className={styles.orderButton}
                                onClick={handleOrder}
                            >
                                Заказать
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};

export default ServiceDetails; 