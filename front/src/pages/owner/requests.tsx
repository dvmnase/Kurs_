import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import RequestChat from '../../components/RequestChat';
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
}

interface Carrier {
    id: number;
    name: string;
    companyName?: string;
    phone?: string;
    email?: string;
    averageRating?: number;
}

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

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Чаты', url: '/owner/chats' },
            { title: 'Маршруты', url: '/owner/routes' },
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
                    <button onClick={() => setShowCreateModal(true)}>📝 Создать заявку</button>
                    <button onClick={() => {
                        fetchAllCarriers();
                        setShowCarriersModal(true);
                    }}>🚚 Просмотреть всех перевозчиков</button>
                </div>
                
                {showCreateModal && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <form onSubmit={handleCreateRequest}>
                                <h2>📝 Создать заявку</h2>
                                <div>
                                    <label>📦 Груз (обязательное поле) - выберите груз для перевозки</label>
                                    <select
                                        value={formData.cargoId}
                                        onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })}
                                        required
                                    >
                                        <option value="">Выберите груз</option>
                                        {cargos.map(cargo => (
                                            <option key={cargo.id} value={cargo.id}>{cargo.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>🚚 Перевозчик (опционально) - выберите перевозчика для заявки</label>
                                    <select
                                        value={formData.carrierId}
                                        onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                    >
                                        <option value="">Не назначен</option>
                                        {carriers.map(carrier => (
                                            <option key={carrier.id} value={carrier.id.toString()}>
                                                {carrier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {carriers.length === 0 && (
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            Нет доступных перевозчиков. Используйте кнопку "Просмотреть всех перевозчиков" для добавления.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label>📅 Дата забора - дата, когда груз будет забран</label>
                                    <input
                                        type="date"
                                        placeholder="Дата забора"
                                        value={formData.pickupDate}
                                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>📅 Дата доставки - дата, когда груз должен быть доставлен</label>
                                    <input
                                        type="date"
                                        placeholder="Дата доставки"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>💬 Комментарий - дополнительная информация о заявке</label>
                                    <textarea
                                        placeholder="Комментарий"
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <button type="submit">Создать</button>
                                    <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                                </div>
                            </form>
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
                            <form onSubmit={handleUpdateRequest}>
                                <h2>✏️ Редактировать заявку #{editingRequest.id}</h2>
                                <div>
                                    <label>🚚 Перевозчик - выберите или измените перевозчика для этой заявки</label>
                                    <select
                                        value={formData.carrierId}
                                        onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                    >
                                        <option value="">Не назначен</option>
                                        {carriers.map(carrier => (
                                            <option key={carrier.id} value={carrier.id.toString()}>
                                                {carrier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {carriers.length === 0 && (
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            Нет доступных перевозчиков. Используйте кнопку "Просмотреть всех перевозчиков" для добавления.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label>📅 Дата отправления - дата, когда груз будет забран</label>
                                    <input
                                        type="date"
                                        placeholder="Дата отправления"
                                        value={formData.pickupDate}
                                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>📅 Дата доставки - дата, когда груз должен быть доставлен</label>
                                    <input
                                        type="date"
                                        placeholder="Дата доставки"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>💬 Комментарий - дополнительная информация о заявке</label>
                                    <textarea
                                        placeholder="Комментарий"
                                        value={formData.comment}
                                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <button type="submit">Сохранить</button>
                                    <button type="button" onClick={() => {
                                        setShowEditModal(false);
                                        setEditingRequest(null);
                                    }}>Отмена</button>
                                </div>
                            </form>
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
                                <p>Статус: {request.status}</p>
                                {request.carrierName && <p>Перевозчик: {request.carrierName}</p>}
                                {request.pickupDate && <p>Дата отправления: {request.pickupDate}</p>}
                                {request.deliveryDate && <p>Дата доставки: {request.deliveryDate}</p>}
                                {request.comment && <p>Комментарий: {request.comment}</p>}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button onClick={() => handleEditRequest(request)}>✏️ Редактировать</button>
                                    <button onClick={() => handleDeleteRequest(request.id)}>🗑️ Удалить</button>
                                    {request.status === 'ACCEPTED' && (
                                        <button 
                                            onClick={() => {
                                                setChatRequestId(request.id);
                                                setShowChat(true);
                                            }}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            💬 Начать чат
                                        </button>
                                    )}
                                    {request.status === 'IN_PROGRESS' && (
                                        <button 
                                            onClick={() => {
                                                setChatRequestId(request.id);
                                                setShowChat(true);
                                            }}
                                            style={{ 
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            💬 Чат
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
                            <h2>🚚 Все перевозчики</h2>
                            {loadingCarriers ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                                    Загрузка перевозчиков...
                                </div>
                            ) : allCarriers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚚</div>
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
                                                        <strong>📞 Телефон:</strong> {carrier.phone}
                                                    </p>
                                                )}
                                                {carrier.email && (
                                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                                        <strong>📧 Email:</strong> {carrier.email}
                                                    </p>
                                                )}
                                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                                                    ID: {carrier.id}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowCarriersModal(false)} style={{ flex: 1 }}>Закрыть</button>
                            </div>
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
                        }}
                    />
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerRequestsPage;

