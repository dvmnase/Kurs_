import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import cn from 'classnames';
import styles from './OrderHistory.module.sass';
import { authService } from '../../services/authService';

const OrderHistory = () => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = authService.getToken();
            const clientId = authService.getClientId();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!clientId) {
                throw new Error('ID клиента не найден');
            }

            console.log('Fetching orders for clientId:', clientId);

            const response = await fetch(`http://localhost:8080/user/orders/history/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Ошибка при загрузке заказов: ${response.status}`);
            }

            const data = await response.json();
            console.log('Orders data:', data);
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError(error.message || 'Не удалось загрузить заказы');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOrderClick = (order) => {
        router.push({
            pathname: '/client/order-details',
            query: { id: order.id }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'NEW':
                return styles.statusNew;
            case 'IN_PROGRESS':
                return styles.statusInProgress;
            case 'COMPLETED':
                return styles.statusCompleted;
            case 'CANCELLED':
                return styles.statusCancelled;
            default:
                return '';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'NEW':
                return 'Новый';
            case 'IN_PROGRESS':
                return 'В работе';
            case 'COMPLETED':
                return 'Завершен';
            case 'CANCELLED':
                return 'Отменен';
            default:
                return status;
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            {orders.length === 0 ? (
                <div className={styles.empty}>У вас пока нет заказов</div>
            ) : (
                <div className={styles.ordersList}>
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className={styles.orderCard}
                            onClick={() => handleOrderClick(order)}
                        >
                            <div className={styles.orderHeader}>
                                <h3 className={styles.serviceName}>{order.serviceName}</h3>
                                <span className={cn(styles.status, styles[order.status.toLowerCase()])}>
                                    {order.status}
                                </span>
                            </div>
                            <div className={styles.orderDetails}>
                                <p className={styles.price}>Стоимость: {order.servicePrice} ₽</p>
                                <p className={styles.date}>
                                    Дата создания: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                {order.employeeName && (
                                    <p className={styles.employee}>
                                        Сотрудник: {order.employeeName}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory; 