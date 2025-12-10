import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import RequestChat from '../../components/RequestChat';
import RouteMapView from '../../components/RouteMapView';
import styles from '../../styles/client/ClientHome.module.sass';

interface Request {
    id: number;
    cargoId: number;
    status: string;
    pickupDate: string;
    deliveryDate: string;
    comment: string;
    cargo: {
        name: string;
    };
    carrierName?: string;
    carrierId?: number;
    hasRoute?: boolean;
    hasReview?: boolean;
}

interface Carrier {
    id: number;
    name: string;
    companyName?: string;
    phone?: string;
    email?: string;
    averageRating?: number;
}

const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'NEW': 'Новая',
        'PENDING': 'Ожидает',
        'ACCEPTED': 'Принята',
        'DECLINED': 'Отклонена',
        'CANCELLED': 'Отменена',
        'IN_PROGRESS': 'В процессе'
    };
    return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
        'NEW': '#66bb6a',
        'PENDING': '#ffc107',
        'ACCEPTED': '#4caf50',
        'DECLINED': '#f44336',
        'CANCELLED': '#9e9e9e',
        'IN_PROGRESS': '#81c784'
    };
    return colorMap[status] || '#333';
};

const OwnerRequestsPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<Request | null>(null);
    const [showCarriersModal, setShowCarriersModal] = useState(false);
    const [allCarriers, setAllCarriers] = useState<Carrier[]>([]);
    const [loadingCarriers, setLoadingCarriers] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatRequestId, setChatRequestId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [viewingRoute, setViewingRoute] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingCarrierId, setReviewingCarrierId] = useState<number | null>(null);
    const [reviewingCarrierName, setReviewingCarrierName] = useState<string>('');
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [viewingCarrierReviews, setViewingCarrierReviews] = useState<any[]>([]);
    const [viewingCarrierNameForReviews, setViewingCarrierNameForReviews] = useState<string>('');
    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [formData, setFormData] = useState({
        cargoId: '',
        carrierId: '',
        pickupDate: '',
        deliveryDate: '',
        comment: ''
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/');
            return;
        }
        fetchCurrentUserId();
        fetchRequests();
        fetchCargos();
        fetchCarriers();
    }, []);

    const fetchCurrentUserId = async () => {
        try {
            // Получаем userId из API
            const response = await api.get('/api/user/me');
            if (response.data && response.data.id) {
                setCurrentUserId(response.data.id);
            }
        } catch (err) {
            console.error('Error fetching current user ID:', err);
            // Fallback: пытаемся получить из localStorage
            const user = authService.getUser();
            if (user && user.id) {
                setCurrentUserId(user.id);
            }
        }
    };

    const fetchCargos = async () => {
        try {
            const response = await api.get('/api/owner/cargo');
            setCargos(response.data);
        } catch (err: any) {
            console.error('Ошибка при загрузке грузов:', err);
        }
    };

    const fetchCarriers = async () => {
        try {
            // Получаем список всех перевозчиков из API
            const response = await api.get('/api/owner/carriers');
            const carriersData = response.data;
            
            const carriersList = carriersData.map((carrier: any) => ({
                id: carrier.id,
                name: carrier.companyName || 'Без названия'
            }));
            
            setCarriers(carriersList);
        } catch (err: any) {
            console.error('Ошибка при загрузке перевозчиков:', err);
            // Fallback: получаем из заявок
            try {
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
                    name
                }));
                
                setCarriers(carriersList);
            } catch (fallbackErr: any) {
                console.error('Ошибка при загрузке перевозчиков из заявок:', fallbackErr);
            }
        }
    };

    const fetchAllCarriers = async () => {
        try {
            setLoadingCarriers(true);
            const response = await api.get('/api/owner/carriers');
            const carriersData = response.data;
            
            // Просто форматируем данные без запросов рейтинга
            const formattedCarriers = carriersData.map((carrier: any) => ({
                ...carrier,
                name: carrier.companyName || 'Без названия'
            }));
            
            setAllCarriers(formattedCarriers);
        } catch (err: any) {
            console.error('Ошибка при загрузке всех перевозчиков:', err);
            setError('Ошибка при загрузке перевозчиков');
        } finally {
            setLoadingCarriers(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/owner/requests');
            setRequests(response.data);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при загрузке заявок');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/owner/requests', {
                cargoId: parseInt(formData.cargoId),
                carrierId: formData.carrierId ? parseInt(formData.carrierId) : null,
                pickupDate: formData.pickupDate || null,
                deliveryDate: formData.deliveryDate || null,
                comment: formData.comment
            });
            setShowCreateModal(false);
            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' });
            fetchRequests();
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при создании заявки');
        }
    };

    const handleEditRequest = (request: Request) => {
        setEditingRequest(request);
        // Получаем carrierId из запроса, если он есть
        const requestWithCarrier = requests.find(r => r.id === request.id);
        const carrierId = (requestWithCarrier as any)?.carrierId?.toString() || '';
        
        setFormData({
            cargoId: request.cargoId.toString(),
            carrierId: carrierId,
            pickupDate: request.pickupDate || '',
            deliveryDate: request.deliveryDate || '',
            comment: request.comment || ''
        });
        // Обновляем список перевозчиков перед открытием модального окна
        fetchCarriers();
        setShowEditModal(true);
    };

    const handleUpdateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;
        try {
            // Если carrierId пустой, передаем -1 для удаления перевозчика
            // Если выбран перевозчик, передаем его ID
            const carrierIdValue = formData.carrierId && formData.carrierId.trim() !== ''
                ? parseInt(formData.carrierId) 
                : -1; // -1 означает удаление перевозчика
            
            console.log('Updating request with carrierId:', carrierIdValue, 'formData.carrierId:', formData.carrierId);
            
            await api.put(`/api/owner/requests/${editingRequest.id}`, {
                pickupDate: formData.pickupDate || null,
                deliveryDate: formData.deliveryDate || null,
                comment: formData.comment,
                carrierId: carrierIdValue
            });
            setShowEditModal(false);
            setEditingRequest(null);
            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' });
            fetchRequests();
            fetchCarriers(); // Обновляем список перевозчиков
            setError(null); // Очищаем ошибки при успехе
        } catch (err: any) {
            console.error('Error updating request:', err);
            const errorMessage = err.response?.data?.message || err.response?.data || 'Ошибка при обновлении заявки';
            setError(errorMessage);
        }
    };

    const handleDeleteRequest = async (id: number) => {
        if (!confirm('Удалить заявку?')) return;
        try {
            await api.delete(`/api/owner/requests/${id}`);
            fetchRequests();
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при удалении заявки');
        }
    };

    const handleOpenReviewModal = (carrierId: number, carrierName: string) => {
        setReviewingCarrierId(carrierId);
        setReviewingCarrierName(carrierName);
        setReviewData({ rating: 0, comment: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewingCarrierId) return;
        if (reviewData.rating === 0) {
            setError('Пожалуйста, выберите рейтинг');
            return;
        }
        try {
            setSubmittingReview(true);
            await api.post('/api/owner/reviews', {
                carrierId: reviewingCarrierId,
                rating: reviewData.rating,
                comment: reviewData.comment
            });
            setShowReviewModal(false);
            setReviewingCarrierId(null);
            setReviewingCarrierName('');
            setReviewData({ rating: 0, comment: '' });
            fetchRequests(); // Обновляем список заявок
        } catch (err: any) {
            console.error('Ошибка отправки отзыва:', err);
            setError(err.response?.data?.message || 'Ошибка отправки отзыва');
        } finally {
            setSubmittingReview(false);
        }
    };

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Чаты', url: '/owner/chats' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    };

    return (
        <Layout title="Заявки" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>Управление заявками</h1>
                    <p style={{ color: '#666', marginTop: '8px' }}>Создавайте и управляйте заявками на перевозку</p>
                </div>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actions}>
                    <button onClick={() => {
                        setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' });
                        setShowCreateModal(true);
                    }}>Создать заявку</button>
                    <button onClick={() => {
                        fetchAllCarriers();
                        setShowCarriersModal(true);
                    }}>Просмотреть всех перевозчиков</button>
                </div>
                
                {showCreateModal && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '4px solid #4caf50' }}>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#1b5e20', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Создать заявку</h2>
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{
                                background: '#e8f5e9',
                                padding: '24px',
                                borderRadius: '14px',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.12)',
                                border: '1px solid #c8e6c9'
                            }}>
                                <form onSubmit={handleCreateRequest}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Груз (обязательное поле) — выберите груз для перевозки
                                        </label>
                                        <select
                                            value={formData.cargoId}
                                            onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                outline: 'none',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">Выберите груз</option>
                                            {cargos.map(cargo => (
                                                <option key={cargo.id} value={cargo.id}>{cargo.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Перевозчик (опционально) — выберите перевозчика для заявки
                                        </label>
                                        <select
                                            value={formData.carrierId}
                                            onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                outline: 'none',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">Не назначен</option>
                                            {carriers.map(carrier => (
                                                <option key={carrier.id} value={carrier.id.toString()}>
                                                    {carrier.name}
                                                </option>
                                            ))}
                                        </select>
                                        {carriers.length === 0 && (
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#388e3c',
                                                marginTop: '10px',
                                                fontStyle: 'italic',
                                                lineHeight: '1.5',
                                                paddingLeft: '4px'
                                            }}>
                                                Нет доступных перевозчиков. Используйте кнопку "Просмотреть всех перевозчиков" для добавления.
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Дата забора — когда груз будет забран
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.pickupDate}
                                            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Дата доставки — когда груз должен быть доставлен
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Комментарий — дополнительная информация о заявке
                                        </label>
                                        <textarea
                                            placeholder="Введите комментарий..."
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                minHeight: '120px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                resize: 'vertical',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                fontFamily: 'inherit',
                                                lineHeight: '1.6',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginTop: '28px',
                                        paddingTop: '20px',
                                        borderTop: '2px solid #c8e6c9'
                                    }}>
                                        <button
                                            type="submit"
                                            style={{
                                                flex: 1,
                                                padding: '14px 0',
                                                background: '#66bb6a',
                                                color: 'white',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '16px',
                                                boxShadow: '0 2px 8px rgba(102, 187, 106, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#4caf50';
                                                target.style.transform = 'translateY(-2px)';
                                                target.style.boxShadow = '0 4px 12px rgba(102, 187, 106, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#66bb6a';
                                                target.style.transform = 'translateY(0)';
                                                target.style.boxShadow = '0 2px 8px rgba(102, 187, 106, 0.3)';
                                            }}
                                        >
                                            Создать
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            style={{
                                                flex: 1,
                                                padding: '14px 0',
                                                background: '#a5d6a7',
                                                color: '#1b5e20',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '16px',
                                                boxShadow: '0 2px 8px rgba(165, 214, 167, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#81c784';
                                                target.style.transform = 'translateY(-2px)';
                                                target.style.boxShadow = '0 4px 12px rgba(165, 214, 167, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#a5d6a7';
                                                target.style.transform = 'translateY(0)';
                                                target.style.boxShadow = '0 2px 8px rgba(165, 214, 167, 0.3)';
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {showEditModal && editingRequest && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEditModal(false);
                            setEditingRequest(null);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '4px solid #4caf50' }}>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#1b5e20', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Редактировать заявку #{editingRequest.id}</h2>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingRequest(null);
                                    }}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{
                                background: '#e8f5e9',
                                padding: '24px',
                                borderRadius: '14px',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.12)',
                                border: '1px solid #c8e6c9'
                            }}>
                                <form onSubmit={handleUpdateRequest}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Перевозчик — выберите или измените перевозчика для этой заявки
                                        </label>
                                        <select
                                            value={formData.carrierId}
                                            onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                outline: 'none',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">Не назначен</option>
                                            {carriers.map(carrier => (
                                                <option key={carrier.id} value={carrier.id.toString()}>
                                                    {carrier.name}
                                                </option>
                                            ))}
                                        </select>
                                        {carriers.length === 0 && (
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#388e3c',
                                                marginTop: '10px',
                                                fontStyle: 'italic',
                                                lineHeight: '1.5',
                                                paddingLeft: '4px'
                                            }}>
                                                Нет доступных перевозчиков. Используйте кнопку "Просмотреть всех перевозчиков" для добавления.
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Дата отправления — когда груз будет забран
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.pickupDate}
                                            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Дата доставки — когда груз должен быть доставлен
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Комментарий — дополнительная информация о заявке
                                        </label>
                                        <textarea
                                            placeholder="Введите комментарий..."
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                minHeight: '120px',
                                                borderRadius: '10px',
                                                border: '2px solid #a5d6a7',
                                                background: 'white',
                                                resize: 'vertical',
                                                fontSize: '15px',
                                                color: '#1b5e20',
                                                fontFamily: 'inherit',
                                                lineHeight: '1.6',
                                                transition: 'all 0.3s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#4caf50';
                                                target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                const target = e.currentTarget;
                                                target.style.borderColor = '#a5d6a7';
                                                target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginTop: '28px',
                                        paddingTop: '20px',
                                        borderTop: '2px solid #c8e6c9'
                                    }}>
                                        <button
                                            type="submit"
                                            style={{
                                                flex: 1,
                                                padding: '14px 0',
                                                background: '#66bb6a',
                                                color: 'white',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '16px',
                                                boxShadow: '0 2px 8px rgba(102, 187, 106, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#4caf50';
                                                target.style.transform = 'translateY(-2px)';
                                                target.style.boxShadow = '0 4px 12px rgba(102, 187, 106, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#66bb6a';
                                                target.style.transform = 'translateY(0)';
                                                target.style.boxShadow = '0 2px 8px rgba(102, 187, 106, 0.3)';
                                            }}
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setEditingRequest(null);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '14px 0',
                                                background: '#a5d6a7',
                                                color: '#1b5e20',
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '16px',
                                                boxShadow: '0 2px 8px rgba(165, 214, 167, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#81c784';
                                                target.style.transform = 'translateY(-2px)';
                                                target.style.boxShadow = '0 4px 12px rgba(165, 214, 167, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                const target = e.currentTarget as HTMLButtonElement;
                                                target.style.background = '#a5d6a7';
                                                target.style.transform = 'translateY(0)';
                                                target.style.boxShadow = '0 2px 8px rgba(165, 214, 167, 0.3)';
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {requests.map((request) => (
                            <div key={request.id} className={styles.item}>
                                <h3>Заявка #{request.id}</h3>
                                <p>Груз: {request.cargo?.name}</p>
                                <p>Статус: <span style={{ 
                                    color: getStatusColor(request.status),
                                    fontWeight: 'bold'
                                }}>{getStatusText(request.status)}</span></p>
                                {request.carrierName && <p>Перевозчик: {request.carrierName}</p>}
                                {request.pickupDate && <p>Дата отправления: {request.pickupDate}</p>}
                                {request.deliveryDate && <p>Дата доставки: {request.deliveryDate}</p>}
                                {request.comment && <p>Комментарий: {request.comment}</p>}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {!request.hasRoute && (
                                        <>
                                            <button onClick={() => handleEditRequest(request)} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Редактировать</button>
                                            <button onClick={() => handleDeleteRequest(request.id)}>Удалить</button>
                                        </>
                                    )}
                                    {request.hasRoute && (
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const response = await api.get(`/api/owner/requests/${request.id}/route`);
                                                    const route = response.data;
                                                    if (route) {
                                                        setViewingRoute(route);
                                                        setShowRouteModal(true);
                                                    }
                                                } catch (err) {
                                                    console.error('Ошибка загрузки маршрута:', err);
                                                    setError('Ошибка загрузки маршрута');
                                                }
                                            }}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Просмотреть маршрут
                                        </button>
                                    )}
                                    {request.status === 'ACCEPTED' && (
                                        <button 
                                            onClick={() => {
                                                setChatRequestId(request.id);
                                                setShowChat(true);
                                            }}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
                                                color: '#1a1a1a',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Начать чат
                                        </button>
                                    )}
                                    {request.status === 'IN_PROGRESS' && (
                                        <button 
                                            onClick={() => {
                                                setChatRequestId(request.id);
                                                setShowChat(true);
                                            }}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
                                                color: '#1a1a1a',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Чат
                                        </button>
                                    )}
                                    {request.carrierId && request.carrierName && !request.hasReview && (
                                        <button 
                                            onClick={() => handleOpenReviewModal(request.carrierId!, request.carrierName!)}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Оставить отзыв
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showCarriersModal && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCarriersModal(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Все перевозчики</h2>
                                <button 
                                    onClick={() => setShowCarriersModal(false)}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            {loadingCarriers ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ marginBottom: '16px' }}>Загрузка...</div>
                                    Загрузка перевозчиков...
                                </div>
                            ) : allCarriers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <h3 style={{ color: '#333', marginBottom: '8px' }}>Нет перевозчиков</h3>
                                    <p style={{ color: '#666' }}>В системе пока нет зарегистрированных перевозчиков</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                    <div className={styles.list} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
                                        {allCarriers.map((carrier) => (
                                            <div key={carrier.id} className={styles.item} style={{ padding: '20px' }}>
                                                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                                                    {carrier.companyName || carrier.name || 'Без названия'}
                                                </h3>
                                                {carrier.phone && (
                                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                                        <strong>Телефон:</strong> {carrier.phone}
                                                    </p>
                                                )}
                                                {carrier.email && (
                                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                                        <strong>Email:</strong> {carrier.email}
                                                    </p>
                                                )}
                                                <div style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <strong>Рейтинг:</strong>
                                                    {carrier.averageRating && carrier.averageRating > 0 ? (
                                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc107' }}>
                                                            {carrier.averageRating.toFixed(1)} / 5.0
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '14px', color: '#999' }}>Нет отзывов</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const response = await api.get(`/api/owner/reviews/carrier/${carrier.id}`);
                                                            setViewingCarrierReviews(response.data);
                                                            setViewingCarrierNameForReviews(carrier.companyName || carrier.name || 'Без названия');
                                                            setShowReviewsModal(true);
                                                        } catch (err) {
                                                            console.error('Ошибка загрузки отзывов:', err);
                                                            setError('Ошибка загрузки отзывов');
                                                        }
                                                    }}
                                                    style={{
                                                        marginTop: '12px',
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Просмотреть отзывы
                                                </button>
                                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                                                    ID: {carrier.id}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showChat && chatRequestId && currentUserId > 0 && (
                    <RequestChat
                        requestId={chatRequestId}
                        currentUserId={currentUserId}
                        isOwner={true}
                        onClose={() => {
                            setShowChat(false);
                            setChatRequestId(null);
                            fetchRequests(); // Обновляем список заявок после закрытия чата
                        }}
                    />
                )}

                {showRouteModal && viewingRoute && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowRouteModal(false);
                            setViewingRoute(null);
                        }
                    }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Маршрут заявки</h2>
                                <button 
                                    onClick={() => {
                                        setShowRouteModal(false);
                                        setViewingRoute(null);
                                    }}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>От:</strong> {viewingRoute.startAddress}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>До:</strong> {viewingRoute.endAddress}
                                </p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                                    Создан: {new Date(viewingRoute.createdAt).toLocaleString('ru-RU')}
                                </p>
                            </div>
                            <RouteMapView
                                startLat={viewingRoute.startLat}
                                startLng={viewingRoute.startLng}
                                endLat={viewingRoute.endLat}
                                endLng={viewingRoute.endLng}
                                startAddress={viewingRoute.startAddress}
                                endAddress={viewingRoute.endAddress}
                                height="500px"
                            />
                        </div>
                    </div>
                )}

                {showReviewModal && reviewingCarrierId && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowReviewModal(false);
                            setReviewingCarrierId(null);
                            setReviewingCarrierName('');
                            setReviewData({ rating: 0, comment: '' });
                        }
                    }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Оставить отзыв перевозчику</h2>
                                <button 
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewingCarrierId(null);
                                        setReviewingCarrierName('');
                                        setReviewData({ rating: 0, comment: '' });
                                    }}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                                    Перевозчик: {reviewingCarrierName}
                                </p>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                    Рейтинг *
                                </label>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '32px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                                            style={{
                                                cursor: 'pointer',
                                                color: star <= reviewData.rating ? '#ffc107' : '#ddd',
                                                transition: 'color 0.2s'
                                            }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                {reviewData.rating > 0 && (
                                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                        Вы выбрали: {reviewData.rating} {reviewData.rating === 1 ? 'звезда' : reviewData.rating < 5 ? 'звезды' : 'звезд'}
                                    </p>
                                )}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                    Комментарий
                                </label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    placeholder="Оставьте ваш отзыв о работе перевозчика..."
                                    style={{
                                        width: '100%',
                                        minHeight: '120px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewingCarrierId(null);
                                        setReviewingCarrierName('');
                                        setReviewData({ rating: 0, comment: '' });
                                    }}
                                    style={{
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview || reviewData.rating === 0}
                                    style={{
                                        background: submittingReview || reviewData.rating === 0 
                                            ? '#ccc' 
                                            : 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: submittingReview || reviewData.rating === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showReviewsModal && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowReviewsModal(false);
                            setViewingCarrierReviews([]);
                            setViewingCarrierNameForReviews('');
                        }
                    }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '80vh', overflowY: 'auto', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Отзывы перевозчика: {viewingCarrierNameForReviews}</h2>
                                <button 
                                    onClick={() => {
                                        setShowReviewsModal(false);
                                        setViewingCarrierReviews([]);
                                        setViewingCarrierNameForReviews('');
                                    }}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        fontSize: '24px', 
                                        cursor: 'pointer',
                                        color: '#333',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            {viewingCarrierReviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    <p>Нет отзывов для этого перевозчика</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {viewingCarrierReviews.map((review: any) => (
                                        <div key={review.id} style={{ 
                                            padding: '16px', 
                                            background: '#f8f9fa', 
                                            borderRadius: '8px',
                                            border: '1px solid #dee2e6'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong>{review.ownerName || 'Грузовладелец'}</strong>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            style={{
                                                                color: star <= review.rating ? '#ffc107' : '#ddd',
                                                                fontSize: '18px'
                                                            }}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                                        {review.rating} / 5
                                                    </span>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p style={{ margin: '8px 0', fontSize: '14px', color: '#333' }}>
                                                    {review.comment}
                                                </p>
                                            )}
                                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                                                {new Date(review.createdAt).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerRequestsPage;

