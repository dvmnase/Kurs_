import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/client/ServiceSearch.module.sass';

const ServiceSearch = () => {
    const [services, setServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('/api/services');
                setServices(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch services');
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOrder = async (serviceId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            await axios.post('/api/orders', {
                serviceId,
                status: 'new'
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert('Order placed successfully!');
        } catch (err) {
            setError('Failed to place order');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.serviceSearch}>
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Поиск услуг..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.serviceList}>
                {filteredServices.length === 0 ? (
                    <div className={styles.empty}>No services found</div>
                ) : (
                    filteredServices.map(service => (
                        <div key={service.id} className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <h3>{service.name}</h3>
                                <span className={styles.price}>${service.price}</span>
                            </div>
                            <p className={styles.description}>{service.description}</p>
                            <button
                                className={styles.orderButton}
                                onClick={() => handleOrder(service.id)}
                            >
                                Заказать
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ServiceSearch; 