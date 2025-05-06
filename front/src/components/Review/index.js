import React, { useState } from 'react';
import { useRouter } from 'next/router';
import cn from 'classnames';
import styles from './Review.module.sass';
import { authService } from '../../services/authService';

const Review = ({ orderId }) => {
    const router = useRouter();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        const readers = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(results => {
            setPhotos(results.map(result => result.split(',')[1])); // Store base64 without data:image prefix
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = authService.getToken();
            const response = await fetch('http://localhost:8080/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    order: orderId,
                    rating,
                    comment,
                    photos
                })
            });

            if (response.ok) {
                router.push('/client/orders');
            } else {
                const error = await response.json();
                alert(error.error || 'Не удалось отправить отзыв');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Произошла ошибка при отправке отзыва');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Оставить отзыв</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.ratingContainer}>
                    <label className={styles.label}>Оценка:</label>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={cn(styles.star, { [styles.active]: star <= rating })}
                                onClick={() => setRating(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Комментарий:</label>
                    <textarea
                        className={styles.textarea}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        placeholder="Расскажите о вашем опыте..."
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Фотографии:</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className={styles.fileInput}
                    />
                </div>

                {photos.length > 0 && (
                    <div className={styles.preview}>
                        {photos.map((photo, index) => (
                            <img
                                key={index}
                                src={`data:image/jpeg;base64,${photo}`}
                                alt={`Preview ${index + 1}`}
                                className={styles.previewImage}
                            />
                        ))}
                    </div>
                )}

                <button
                    type="submit"
                    className={cn('button', styles.submit)}
                    disabled={loading}
                >
                    {loading ? 'Отправка...' : 'Отправить отзыв'}
                </button>
            </form>
        </div>
    );
};

export default Review; 