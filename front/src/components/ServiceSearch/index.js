import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import cn from 'classnames';
import styles from './ServiceSearch.module.sass';
import authService from '../../services/authService';

const ServiceSearch = () => {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (minPrice) queryParams.append('minPrice', minPrice);
            if (maxPrice) queryParams.append('maxPrice', maxPrice);

            const response = await fetch(`http://localhost:8080/user/services?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }

            const data = await response.json();
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Failed to load services. Please try again later.');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [search, minPrice, maxPrice]);

    const handleServiceClick = (service) => {
        router.push({
            pathname: '/client/service-details',
            query: {
                id: service._id,
                name: service.name,
                description: service.description,
                price: service.price,
                photo: service.photo
            }
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Поиск услуг..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
                <div className={styles.priceFilter}>
                    <input
                        type="number"
                        placeholder="Мин. цена"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className={styles.priceInput}
                    />
                    <input
                        type="number"
                        placeholder="Макс. цена"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className={styles.priceInput}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Загрузка...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : services.length === 0 ? (
                <div className={styles.noResults}>Услуги не найдены</div>
            ) : (
                <div className={styles.servicesGrid}>
                    {services.map((service) => (
                        <div
                            key={service._id}
                            className={styles.serviceCard}
                            onClick={() => handleServiceClick(service)}
                        >
                            <img
                                src={service.photo || '/images/services/default.jpg'}
                                alt={service.name}
                                className={styles.serviceImage}
                            />
                            <div className={styles.serviceInfo}>
                                <h3 className={styles.serviceName}>{service.name}</h3>
                                <p className={styles.serviceDescription}>{service.description}</p>
                                <p className={styles.servicePrice}>{service.price} руб.</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServiceSearch; 