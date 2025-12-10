import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
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
    ownerName: string;
    hasRoute?: boolean;
}

const CarrierRequestsPage = () => {
    const router = useRouter();
    const [myRequests, setMyRequests] = useState<Request[]>([]);
    const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
    const [activeTab, setActiveTab] = useState<'my' | 'available'>('available');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatRequestId, setChatRequestId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isCarrier()) {
            router.push('/');
            return;
        }
        fetchCurrentUserId();
        fetchRequests();
    }, []);

    const fetchCurrentUserId = async () => {
        try {
            const response = await api.get('/api/user/me');
            if (response.data && response.data.id) {
                setCurrentUserId(response.data.id);
            }
        } catch (err) {
            console.error('Error fetching current user ID:', err);
            const user = authService.getUser();
            if (user && user.id) {
                setCurrentUserId(user.id);
            }
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const [myResponse, availableResponse] = await Promise.all([
                api.get('/api/carrier/requests'),
                api.get('/api/carrier/requests/available')
            ]);
            setMyRequests(myResponse.data);
            setAvailableRequests(availableResponse.data);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке заявок');
            } else {
                setError('Ошибка при загрузке заявок');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (id: number) => {
        try {
            setError(null);
            await api.post(`/api/carrier/requests/${id}/accept`);
            fetchRequests();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при принятии заявки');
            } else {
                setError('Ошибка при принятии заявки');
            }
        }
    };

    const handleDeclineRequest = async (id: number) => {
        try {
            setError(null);
            await api.post(`/api/carrier/requests/${id}/decline`);
            fetchRequests();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при отклонении заявки');
            } else {
                setError('Ошибка при отклонении заявки');
            }
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            setError(null);
            await api.put(`/api/carrier/requests/${id}/status`, {
                status: newStatus
            });
            fetchRequests();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при изменении статуса');
            } else {
                setError('Ошибка при изменении статуса');
            }
        }
    };

    const navigation = {
        menu: [
            { title: 'Заявки', url: '/carrier/requests' },
            { title: 'Чаты', url: '/carrier/chats' },
            { title: 'Транспорт', url: '/carrier/transports' },
            { title: 'Настройки', url: '/carrier/settings' },
        ],
    };

    return (
        <Layout navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Заявки на перевозку</h1>
                {error && <div className={styles.error}>{error}</div>}
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('available')}
                        style={{ 
                            background: activeTab === 'available' ? '#007bff' : '#ccc',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Доступные заявки ({availableRequests.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('my')}
                        style={{ 
                            background: activeTab === 'my' ? '#007bff' : '#ccc',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Мои заявки ({myRequests.length})
                    </button>
                </div>

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {(activeTab === 'available' ? availableRequests : myRequests).map((request) => (
                            <div key={request.id} className={styles.item}>
                                <h3>Заявка #{request.id}</h3>
                                <p><strong>Груз:</strong> {request.cargo?.name}</p>
                                <p><strong>Грузовладелец:</strong> {request.ownerName}</p>
                                <p><strong>Статус:</strong> {request.status}</p>
                                {request.pickupDate && <p><strong>Дата забора:</strong> {request.pickupDate}</p>}
                                {request.deliveryDate && <p><strong>Дата доставки:</strong> {request.deliveryDate}</p>}
                                {request.comment && <p><strong>Комментарий:</strong> {request.comment}</p>}
                                {/* Кнопки для доступных заявок */}
                                {activeTab === 'available' && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {request.status === 'NEW' || request.status === 'PENDING' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                                                    }}
                                                >
                                                    Принять заявку
                                                </button>
                                                <button 
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
                                                    }}
                                                >
                                                    ✗ Отклонить заявку
                                                </button>
                                            </>
                                        ) : (
                                            <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                                                {request.status === 'ACCEPTED' ? 'Заявка уже принята' : 
                                                 request.status === 'DECLINED' ? 'Заявка отклонена' : 
                                                 'Заявка недоступна'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Кнопки для моих заявок */}
                                {activeTab === 'my' && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {request.status === 'ACCEPTED' && (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setChatRequestId(request.id);
                                                        setShowChat(true);
                                                    }}
                                                    style={{ 
                                                    background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
                                                    color: '#1a1a1a',
                                                    border: 'none',
                                                    padding: '10px 20px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
                                                }}
                                            >
                                                Начать чат
                                                </button>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                                    <strong>Статус:</strong>
                                                    <select
                                                        value={request.status}
                                                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ddd',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        <option value="ACCEPTED">Принята</option>
                                                        <option value="IN_PROGRESS">В процессе</option>
                                                        <option value="DECLINED">Отклонена</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}
                                        {request.status === 'IN_PROGRESS' && (
                                            <>
                                                <button 
                                                    onClick={() => {
                                                        setChatRequestId(request.id);
                                                        setShowChat(true);
                                                    }}
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                                    }}
                                                >
                                                    Чат
                                                </button>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                                    <strong>Статус:</strong>
                                                    <select
                                                        value={request.status}
                                                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ddd',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        <option value="ACCEPTED">Принята</option>
                                                        <option value="IN_PROGRESS">В процессе</option>
                                                        <option value="DECLINED">Отклонена</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}
                                        {request.status === 'DECLINED' && (
                                            <p style={{ color: '#dc3545', fontSize: '14px', fontStyle: 'italic' }}>
                                                Заявка отклонена
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {(activeTab === 'available' ? availableRequests : myRequests).length === 0 && (
                            <div>Нет заявок</div>
                        )}
                    </div>
                )}

                {showChat && chatRequestId && currentUserId > 0 && (
                    <RequestChat
                        requestId={chatRequestId}
                        currentUserId={currentUserId}
                        isOwner={false}
                        onClose={() => {
                            setShowChat(false);
                            setChatRequestId(null);
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default CarrierRequestsPage;
