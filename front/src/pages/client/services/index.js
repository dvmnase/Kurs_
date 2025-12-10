import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../../services/authService';
import ClientLayout from '../../../components/client/ClientLayout';
import Card from '../../../components/Card';
import styles from '../../../styles/client/ClientServices.module.sass';

export default function ServicesPage() {
    const router = useRouter();
    const [priceFilter, setPriceFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigation = {
        menu: [
            {
                title: 'Услуги',
                url: '/client/services',
            },
            {
                title: 'Поиск',
                url: '/client/search',
            },
            {
                title: 'Сотрудники',
                url: '/client/employees',
            },
            {
                title: 'Отзывы',
                url: '/client/reviews',
            },
        ],
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('http://localhost:8080/user/services', {
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

    const handleLogout = () => {
        authService.logout();
        router.push('/');
    };

    if (loading) {
        return (
            <ClientLayout navigationPaths={navigation} showLogout={true} onLogout={handleLogout}>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </ClientLayout>
        );
    }

    if (error) {
        return (
            <ClientLayout navigationPaths={navigation} showLogout={true} onLogout={handleLogout}>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout navigationPaths={navigation} showLogout={true} onLogout={handleLogout}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Наши услуги</h1>
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
                </div>

                <div className={styles.promoBlock}>
                    <div className={styles.promoContent}>
                        <div className={styles.promoText}>
                            <h2>HeatTruck - Ваш надежный партнер в грузоперевозках</h2>
                            <p>
                                Мы предлагаем профессиональные услуги по перевозке грузов любого типа и объема. 
                                Наша команда гарантирует безопасность, своевременность и качество доставки. 
                                С нами ваши грузы в надежных руках!
                            </p>
                            <p>
                                Более 10 лет опыта в сфере логистики и грузоперевозок. 
                                Современный автопарк, квалифицированные водители и индивидуальный подход к каждому клиенту.
                            </p>
                        </div>
                        <div className={styles.promoVideo}>
                            <iframe
                                src="https://www.youtube.com/embed/cyJGnV-vrdo?modestbranding=1&rel=0&showinfo=0"
                                title="HeatTruck Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className={styles.video}
                            ></iframe>
                        </div>
                    </div>
                </div>

                <div className={styles.servicesGrid}>
                    {filteredServices.map((service) => (
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
                                            imgix_url: service.photo ? `data:image/jpeg;base64,${service.photo}` : '/images/services/default.jpg'
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
} 