import React, { useState, useEffect } from 'react';
import ClientLayout from '../../components/client/ClientLayout';
import { authService } from '../../services/authService';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import styles from '../../styles/client/OrderHistory.module.sass';
import { useRouter } from 'next/router';
import cn from 'classnames';

interface Order {
    id: number;
    serviceName: string;
    servicePrice: number;
    status: string;
    createdAt: string;
    completedAt?: string;
    employeeName?: string;
}

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const router = useRouter();

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const token = authService.getToken();
                const clientId = authService.getClientId();

                if (!token) {
                    throw new Error('Требуется авторизация');
                }

                if (!clientId) {
                    throw new Error('ID клиента не найден');
                }

                const response = await fetch(`http://localhost:8080/user/orders/client/${clientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при загрузке истории заказов');
                }

                const data = await response.json();
                setOrders(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Произошла ошибка');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, []);

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

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return (
            <ProtectedRoute>
                <ClientLayout>
                    <div className={styles.loading}>Загрузка...</div>
                </ClientLayout>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute>
                <ClientLayout>
                    <div className={styles.error}>{error}</div>
                </ClientLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <ClientLayout>
                <div className={styles.container}>
                    <h1>История заказов</h1>

                    <div className={styles.filters}>
                        <button
                            className={cn(styles.filterButton, { [styles.active]: filter === 'all' })}
                            onClick={() => setFilter('all')}
                        >
                            Все
                        </button>
                        <button
                            className={cn(styles.filterButton, { [styles.active]: filter === 'COMPLETED' })}
                            onClick={() => setFilter('COMPLETED')}
                        >
                            Завершенные
                        </button>
                        <button
                            className={cn(styles.filterButton, { [styles.active]: filter === 'CANCELLED' })}
                            onClick={() => setFilter('CANCELLED')}
                        >
                            Отмененные
                        </button>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className={styles.empty}>
                            У вас пока нет заказов в истории
                        </div>
                    ) : (
                        <div className={styles.ordersList}>
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={styles.orderCard}
                                    onClick={() => handleOrderClick(order.id)}
                                >
                                    <div className={styles.orderHeader}>
                                        <h3>Заказ #{order.id}</h3>
                                        <span className={cn(styles.status, styles[order.status])}>
                                            {getStatusTranslation(order.status)}
                                        </span>
                                    </div>
                                    <div className={styles.orderDetails}>
                                        <p><strong>Услуга:</strong> {order.serviceName}</p>
                                        <p><strong>Цена:</strong> {order.servicePrice} ₽</p>
                                        {order.employeeName && (
                                            <p><strong>Сотрудник:</strong> {order.employeeName}</p>
                                        )}
                                        <p><strong>Дата создания:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                        {order.completedAt && (
                                            <p><strong>Дата завершения:</strong> {new Date(order.completedAt).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ClientLayout>
        </ProtectedRoute>
    );
};

export default OrderHistoryPage; 