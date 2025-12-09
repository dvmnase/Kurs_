import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import styles from '../../styles/client/ClientHome.module.sass';

interface Review {
    id: number;
    carrierId: number;
    carrierName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface Carrier {
    id: number;
    companyName: string;
    averageRating?: number;
}

const OwnerReviewsPage = () => {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        carrierId: '',
        rating: '5',
        comment: ''
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/');
            return;
        }
        fetchCarriers();
    }, []);

    const fetchCarriers = async () => {
        try {
            // Получаем список перевозчиков из заявок
            const requestsResponse = await api.get('/api/owner/requests');
            const requests = requestsResponse.data;
            const uniqueCarriers = new Map<number, string>();
            
            requests.forEach((req: any) => {
                if (req.carrierId && req.carrierName) {
                    uniqueCarriers.set(req.carrierId, req.carrierName);
                }
            });
            
            const carriersList = Array.from(uniqueCarriers.entries()).map(([id, name]) => ({
                id,
                companyName: name
            }));
            
            // Получаем рейтинги для каждого перевозчика
            const carriersWithRatings = await Promise.all(
                carriersList.map(async (carrier) => {
                    try {
                        const ratingResponse = await api.get(`/api/carrier/rating/${carrier.id}`);
                        return { ...carrier, averageRating: ratingResponse.data.averageRating };
                    } catch {
                        return { ...carrier, averageRating: 0 };
                    }
                })
            );
            
            setCarriers(carriersWithRatings);
        } catch (err: any) {
            console.error('Ошибка при загрузке перевозчиков:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/owner/reviews', {
                carrierId: parseInt(formData.carrierId),
                rating: parseInt(formData.rating),
                comment: formData.comment
            });
            setShowCreateModal(false);
            setFormData({ carrierId: '', rating: '5', comment: '' });
            setSuccess('Отзыв успешно создан');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при создании отзыва');
        }
    };

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Маршруты', url: '/owner/routes' },
            { title: 'Отзывы', url: '/owner/reviews' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    };

    return (
        <Layout navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Отзывы о перевозчиках</h1>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}
                <button onClick={() => setShowCreateModal(true)}>Оставить отзыв</button>
                
                {showCreateModal && (
                    <div className={styles.modal}>
                        <form onSubmit={handleCreateReview}>
                            <h2>Создать отзыв</h2>
                            <select
                                value={formData.carrierId}
                                onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                required
                            >
                                <option value="">Выберите перевозчика</option>
                                {carriers.map(carrier => (
                                    <option key={carrier.id} value={carrier.id}>
                                        {carrier.companyName} {carrier.averageRating ? `(Рейтинг: ${carrier.averageRating.toFixed(1)})` : ''}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                required
                            >
                                <option value="1">1 звезда</option>
                                <option value="2">2 звезды</option>
                                <option value="3">3 звезды</option>
                                <option value="4">4 звезды</option>
                                <option value="5">5 звезд</option>
                            </select>
                            <textarea
                                placeholder="Комментарий"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            />
                            <button type="submit">Создать</button>
                            <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div>
                        <h2>Перевозчики с рейтингами</h2>
                        <div className={styles.list}>
                            {carriers.map((carrier) => (
                                <div key={carrier.id} className={styles.item}>
                                    <h3>{carrier.companyName}</h3>
                                    <p>Средний рейтинг: {carrier.averageRating ? `${carrier.averageRating.toFixed(1)} ⭐` : 'Нет оценок'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerReviewsPage;
