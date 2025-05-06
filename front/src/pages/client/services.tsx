import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/client/ClientLayout';
import Card from '../../components/Card';
import styles from '../../styles/client/Services.module.sass';

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    photo?: string;
}

const ServicesPage = () => {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [priceFilter, setPriceFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('http://localhost:8080/user/services', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при загрузке услуг');
                }

                const data = await response.json();
                setServices(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Произошла ошибка');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const filteredServices = services.filter(service => {
        const matchesPrice = priceFilter === 'all' ||
            (priceFilter === 'low' && service.price <= 2000) ||
            (priceFilter === 'medium' && service.price > 2000 && service.price <= 3000) ||
            (priceFilter === 'high' && service.price > 3000);

        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesPrice && matchesSearch;
    });

    if (loading) {
        return (
            <ClientLayout>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </ClientLayout>
        );
    }

    if (error) {
        return (
            <ClientLayout>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className={styles.container}>
                <h1>Услуги</h1>
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Поиск услуг..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <select
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">Все цены</option>
                        <option value="low">До 2000 ₽</option>
                        <option value="medium">2000-3000 ₽</option>
                        <option value="high">Более 3000 ₽</option>
                    </select>
                </div>
                <div className={styles.servicesGrid}>
                    {filteredServices.map(service => (
                        <div key={service.id} onClick={() => router.push({
                            pathname: '/client/service-details',
                            query: {
                                id: service.id,
                                name: service.name,
                                description: service.description,
                                price: service.price,
                                photo: service.photo
                            }
                        })}>
                            <Card
                                className={styles.card}
                                item={{
                                    id: service.id,
                                    title: service.name,
                                    metadata: {
                                        image: {
                                            imgix_url: service.photo ? `data:image/jpeg;base64,${service.photo}` : '/images/content/mainPict.png'
                                        },
                                        price: service.price,
                                        description: service.description,
                                        categories: [{ title: 'Услуга' }],
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </ClientLayout>
    );
};

export default ServicesPage; 