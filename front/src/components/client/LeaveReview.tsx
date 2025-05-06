import React, { useState } from 'react';
import { authService } from '../../services/authService';
import styles from '../../styles/client/LeaveReview.module.sass';

interface LeaveReviewProps {
    orderId: number;
    serviceId: number;
}

const LeaveReview: React.FC<LeaveReviewProps> = ({ orderId, serviceId }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const clientId = authService.getUserId();
            if (!clientId) {
                throw new Error('Не удалось получить ID клиента');
            }

            const response = await fetch('http://localhost:8080/user/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId,
                    orderId,
                    rating,
                    comment
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке отзыва');
            }

            setSuccess(true);
            setComment('');
            setRating(5);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    return (
        <div className={styles.container}>
            <h3>Оставить отзыв</h3>
            <form onSubmit={handleSubmit}>
                <div className={styles.rating}>
                    <label>Оценка:</label>
                    <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className={styles.ratingSelect}
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                                {value} {value === 1 ? 'звезда' : value < 5 ? 'звезды' : 'звезд'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.comment}>
                    <label>Комментарий:</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Опишите ваши впечатления..."
                        className={styles.commentTextarea}
                    />
                </div>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>Отзыв успешно отправлен!</div>}
                <button type="submit" className={styles.submitButton}>
                    Отправить отзыв
                </button>
            </form>
        </div>
    );
};

export default LeaveReview;