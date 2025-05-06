import React, { useState, useEffect } from 'react';
import ClientLayout from '../../components/client/ClientLayout';
import { authService } from '../../services/authService';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import styles from '../../styles/client/Orders.module.sass';
import { useRouter } from 'next/router';
import cn from 'classnames';
import axios from 'axios';

interface Order {
    id: number;
    serviceName: string;
    servicePrice: number;
    status: string;
    createdAt: string;
    employeeName?: string;
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const clientId = authService.getClientId();
                const token = authService.getToken();
                const user = authService.getUser();

                console.log('Debug info:', {
                    clientId,
                    token,
                    user,
                    localStorage: {
                        user: localStorage.getItem('user'),
                        token: localStorage.getItem('token'),
                        role: localStorage.getItem('role')
                    }
                });

                if (!user) {
                    throw new Error('Данные пользователя не найдены. Пожалуйста, войдите снова.');
                }

                if (!clientId) {
                    throw new Error('ID клиента не найден. Пожалуйста, войдите снова.');
                }

                if (!token) {
                    throw new Error('Токен авторизации отсутствует. Пожалуйста, войдите снова.');
                }

                // Create axios instance with auth header
                const axiosInstance = axios.create({
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Используем правильный URL с clientId как path-параметр
                const url = `http://localhost:8080/user/orders/history/${clientId}`;
                console.log('Making request to:', url);

                const response = await axiosInstance.get(url);
                console.log('Orders response:', response.data);
                setOrders(response.data);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching orders:', err);
                if (err.response?.status === 401) {
                    setError('Сессия истекла. Пожалуйста, войдите снова.');
                    router.push('/');
                } else if (err.response?.status === 405) {
                    setError('Неподдерживаемый метод запроса. Пожалуйста, обновите страницу.');
                } else if (err.response?.status === 400) {
                    setError('Ошибка в параметрах запроса: ' + (err.response.data?.error || err.message));
                } else {
                    setError(err.message || 'Произошла ошибка при загрузке заказов');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    const handleOrderClick = (orderId: number) => {
        router.push(`/client/orders/${orderId}`);
    };

    const getStatusTranslation = (status: string) => {
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

    if (loading) {
        return (
            <ClientLayout>
                <div className={styles.loading}>Загрузка...</div>
            </ClientLayout>
        );
    }

    if (error) {
        return (
            <ClientLayout>
                <div className={styles.error}>{error}</div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className={styles.container}>
                <h1 className={styles.title}>Мои заказы</h1>
                {orders.length === 0 ? (
                    <div className={styles.empty}>У вас пока нет заказов</div>
                ) : (
                    <div className={styles.ordersList}>
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className={styles.orderCard}
                                onClick={() => handleOrderClick(order.id)}
                            >
                                <div className={styles.orderHeader}>
                                    <h3 className={styles.serviceName}>{order.serviceName}</h3>
                                    <span className={cn(styles.status, styles[order.status.toLowerCase()])}>
                                        {getStatusTranslation(order.status)}
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
        </ClientLayout>
    );
};

export default OrdersPage; 