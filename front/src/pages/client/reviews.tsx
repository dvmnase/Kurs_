import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import styles from '../../styles/pages/Reviews.module.sass';

interface Review {
    id: number;
    clientId: number;
    orderId: number;
    rating: number;
    comment: string;
    createdAt: string;
    serviceName: string;
    clientName: string;
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = authService.getToken();
            const clientId = authService.getClientId();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!clientId) {
                throw new Error('ID клиента не найден');
            }

            console.log('Fetching reviews for clientId:', clientId);

            // Получаем отзывы для конкретного клиента
            const response = await fetch(`http://localhost:8080/user/reviews/client/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке отзывов');
            }

            const data = await response.json();
            console.log('Received reviews:', data);
            setReviews(data);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const getRatingStars = (rating: number) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Загрузка отзывов...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Мои отзывы</h1>
            {reviews.length === 0 ? (
                <div className={styles.empty}>
                    У вас пока нет отзывов. Оставьте свой первый отзыв после завершения заказа!
                </div>
            ) : (
                <div className={styles.reviewsList}>
                    {reviews.map(review => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <h3 className={styles.serviceName}>{review.serviceName}</h3>
                                <div className={styles.rating}>
                                    <span className={styles.stars}>{getRatingStars(review.rating)}</span>
                                    <span className={styles.ratingNumber}>{review.rating}/5</span>
                                </div>
                            </div>
                            <p className={styles.comment}>{review.comment}</p>
                            <div className={styles.reviewFooter}>
                                <span className={styles.date}>
                                    {formatDate(review.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewsPage; 