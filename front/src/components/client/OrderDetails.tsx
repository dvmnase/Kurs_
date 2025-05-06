import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import LeaveReview from './LeaveReview';
import styles from '../../styles/client/OrderDetails.module.sass';

interface OrderDetails {
    orderId: number;
    serviceName: string;
    servicePrice: number;
    serviceId: number;
    employeeName: string;
    employeePhone: string;
    employeeId: number;
    status: string;
    description: string;
    createdAt: string;
}

const OrderDetails: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Требуется авторизация');
                }

                const response = await fetch(`http://localhost:8080/user/orders/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Ошибка при получении данных заказа');
                }

                const data = await response.json();
                setOrder(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Произошла ошибка');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    const handleCancelOrder = async () => {
        try {
            const token = authService.getToken();
            const clientId = authService.getUserId();
            if (!token || !clientId) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/user/orders/${orderId}/cancel?clientId=${clientId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при отмене заказа');
            }

            // Обновляем статус заказа
            if (order) {
                setOrder({ ...order, status: 'CANCELLED' });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!order) {
        return null;
    }

    const canCancel = order.status === 'NEW';
    const canReview = order.status === 'COMPLETED';

    return (
        <div className={styles.container}>
            <h2>Детали заказа #{order.orderId}</h2>

            <div className={styles.details}>
                <div className={styles.section}>
                    <h3>Услуга</h3>
                    <p><strong>Название:</strong> {order.serviceName}</p>
                    <p><strong>Цена:</strong> {order.servicePrice} ₽</p>
                </div>

                <div className={styles.section}>
                    <h3>Сотрудник</h3>
                    <p><strong>Имя:</strong> {order.employeeName}</p>
                    <p><strong>Телефон:</strong> {order.employeePhone}</p>
                </div>

                <div className={styles.section}>
                    <h3>Статус</h3>
                    <p className={styles.status}>{order.status}</p>
                    <p><strong>Дата создания:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                {order.description && (
                    <div className={styles.section}>
                        <h3>Описание</h3>
                        <p>{order.description}</p>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                {canCancel && (
                    <button
                        onClick={handleCancelOrder}
                        className={styles.cancelButton}
                    >
                        Отменить заказ
                    </button>
                )}

                {canReview && !showReviewForm && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className={styles.reviewButton}
                    >
                        Оставить отзыв
                    </button>
                )}
            </div>

            {showReviewForm && (
                <LeaveReview
                    orderId={order.orderId}
                    serviceId={order.serviceId}
                />
            )}
        </div>
    );
};

export default OrderDetails;