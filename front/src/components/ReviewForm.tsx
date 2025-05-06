import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import styles from '../styles/components/ReviewForm.module.sass';

interface Order {
    orderId: number;
    serviceName: string;
    status: string;
    createdAt: string;
    employeeName?: string;
}

interface Review {
    id: number;
    clientId: number;
    orderId: number;
    rating: number;
    comment: string;
    createdAt: string;
}

const ReviewForm = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchCompletedOrders();
    }, []);

    const fetchCompletedOrders = async () => {
        try {
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
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке заказов');
            }

            const data = await response.json();
            console.log('Received orders:', data);
            const completedOrders = data.filter((order: Order) => order.status === 'COMPLETED');
            console.log('Completed orders:', completedOrders);
            setOrders(completedOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) {
            setError('Пожалуйста, выберите заказ');
            return;
        }

        if (rating < 1 || rating > 5) {
            setError('Оценка должна быть от 1 до 5');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            const clientId = authService.getClientId();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!clientId) {
                throw new Error('ID клиента не найден');
            }

            console.log('Submitting review for order:', selectedOrder);

            // Формируем URL с параметрами запроса
            const url = new URL('http://localhost:8080/user/reviews');
            url.searchParams.append('clientId', clientId.toString());
            url.searchParams.append('orderId', selectedOrder.toString());
            url.searchParams.append('rating', rating.toString());
            url.searchParams.append('comment', comment);

            console.log('Request URL:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Ошибка при отправке отзыва');
            }

            setSuccess(true);
            setSelectedOrder(null);
            setRating(5);
            setComment('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error submitting review:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (orders.length === 0) {
        return <div className={styles.empty}>У вас пока нет завершенных заказов для отзыва</div>;
    }

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="order">Выберите заказ:</label>
                    <select
                        id="order"
                        value={selectedOrder || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            console.log('Selected value:', value);
                            setSelectedOrder(value ? Number(value) : null);
                        }}
                        className={styles.select}
                    >
                        <option value="">Выберите заказ</option>
                        {orders.map(order => (
                            <option key={order.orderId} value={order.orderId}>
                                Заказ #{order.orderId} - {order.serviceName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Оценка:</label>
                    <div
                        className={styles.rating}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`${styles.star} ${(hoverRating || rating) >= value ? styles.active : ''}`}
                                onClick={() => setRating(value)}
                                onMouseEnter={() => setHoverRating(value)}
                                title={`${value} ${value === 1 ? 'звезда' : value < 5 ? 'звезды' : 'звезд'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="comment">Комментарий:</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={styles.textarea}
                        placeholder="Опишите ваши впечатления..."
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Отправка...' : 'Отправить отзыв'}
                </button>

                {success && (
                    <div className={styles.success}>
                        Отзыв успешно отправлен!
                    </div>
                )}
            </form>
        </div>
    );
};

export default ReviewForm; 