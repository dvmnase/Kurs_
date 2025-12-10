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
    cargo: {
        name: string;
    };
    ownerName?: string;
    lastMessage?: {
        text: string;
        createdAt: string;
    };
}

const CarrierChatsPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
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
        fetchChats();
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

    const fetchChats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/carrier/requests');
            const allRequests = response.data;
            
            // Фильтруем только заявки со статусом ACCEPTED или IN_PROGRESS
            const chatRequests = allRequests.filter((req: Request) => 
                req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS'
            );

            // Получаем последние сообщения для каждой заявки
            const requestsWithMessages = await Promise.all(
                chatRequests.map(async (req: Request) => {
                    try {
                        const messagesResponse = await api.get(`/api/messages/request/${req.id}`);
                        const messages = messagesResponse.data;
                        if (messages && messages.length > 0) {
                            const lastMessage = messages[messages.length - 1];
                            return {
                                ...req,
                                lastMessage: {
                                    text: lastMessage.type === 'ROUTE' ? '🗺️ Маршрут' : lastMessage.text,
                                    createdAt: lastMessage.createdAt
                                }
                            };
                        }
                        return req;
                    } catch {
                        return req;
                    }
                })
            );

            setRequests(requestsWithMessages);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке чатов');
            } else {
                setError('Ошибка при загрузке чатов');
            }
        } finally {
            setLoading(false);
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
        <Layout title="Чаты" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>💬 Чаты</h1>
                    <p style={{ color: '#666', marginTop: '8px' }}>Общение с грузовладельцами по заявкам</p>
                </div>
                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#666' }}>
                        <div style={{ marginBottom: '16px' }}>⏳</div>
                        Загрузка чатов...
                    </div>
                ) : requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>Нет активных чатов</h3>
                        <p style={{ color: '#666' }}>Чаты появятся после принятия заявок</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {requests.map((request) => (
                            <div key={request.id} className={styles.item} style={{ cursor: 'pointer' }} onClick={() => {
                                setChatRequestId(request.id);
                                setShowChat(true);
                            }}>
                                <h3>Заявка #{request.id}</h3>
                                <p><strong>Груз:</strong> {request.cargo?.name}</p>
                                {request.ownerName && <p><strong>Грузовладелец:</strong> {request.ownerName}</p>}
                                <p><strong>Статус:</strong> {request.status === 'ACCEPTED' ? '✅ Принята' : request.status === 'IN_PROGRESS' ? '🚚 В процессе' : request.status}</p>
                                {request.lastMessage && (
                                    <div style={{ marginTop: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                            <strong>Последнее сообщение:</strong> {request.lastMessage.text.length > 50 
                                                ? request.lastMessage.text.substring(0, 50) + '...' 
                                                : request.lastMessage.text}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 0' }}>
                                            {new Date(request.lastMessage.createdAt).toLocaleString('ru-RU')}
                                        </p>
                                    </div>
                                )}
                                <button 
                                    style={{ 
                                        marginTop: '12px',
                                        padding: '10px 20px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChatRequestId(request.id);
                                        setShowChat(true);
                                    }}
                                >
                                    💬 Открыть чат
                                </button>
                            </div>
                        ))}
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
                            fetchChats(); // Обновляем список после закрытия чата
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default CarrierChatsPage;

