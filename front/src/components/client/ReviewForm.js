import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/client/ReviewForm.module.sass';

const ReviewForm = () => {
    const [completedOrders, setCompletedOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchCompletedOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login';
                    return;
                }

                const response = await axios.get('/api/orders/completed', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setCompletedOrders(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch completed orders');
                setLoading(false);
            }
        };

        fetchCompletedOrders();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/reviews', {
                orderId: selectedOrder,
                rating,
                comment
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(true);
            setSelectedOrder('');
            setRating(5);
            setComment('');
        } catch (err) {
            setError('Failed to submit review');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.reviewForm}>
            <h2>Оставить отзыв</h2>
            {success && (
                <div className={styles.success}>
                    Отзыв успешно отправлен!
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="order">Выберите заказ:</label>
                    <select
                        id="order"
                        value={selectedOrder}
                        onChange={(e) => setSelectedOrder(e.target.value)}
                        required
                    >
                        <option value="">Выберите заказ</option>
                        {completedOrders.map(order => (
                            <option key={order.id} value={order.id}>
                                Заказ #{order.id} - {order.service}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Оценка:</label>
                    <div className={styles.rating}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${rating >= star ? styles.active : ''}`}
                                onClick={() => setRating(star)}
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
                        required
                        rows={4}
                        placeholder="Опишите ваш опыт..."
                    />
                </div>

                <button type="submit" className={styles.submitButton}>
                    Отправить отзыв
                </button>
            </form>
        </div>
    );
};

export default ReviewForm; 