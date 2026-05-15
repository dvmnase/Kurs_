import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import RequestChat from '../../components/RequestChat';
import styles from '../../styles/client/ClientHome.module.sass';
import chatStyles from '../../styles/client/Chats.module.sass';
import { getStatusKey, getStatusLabel } from '../../utils/statusLabels';

interface Request {
    id: number;
    cargoId: number;
    status: string;
    cargo: {
        name: string;
    };
    carrierName?: string;
    carrierId?: number;
    lastMessage?: {
        text: string;
        createdAt: string;
    };
}

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

const OwnerChatsPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatRequestId, setChatRequestId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number>(0);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
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
            const response = await api.get('/api/owner/requests');
            const allRequests = response.data;
            
            // Показываем все заявки с перевозчиком (не фильтруем по статусу)
            const chatRequests = allRequests.filter((req: Request) => 
                req.carrierId != null
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
                                    text: lastMessage.type === 'ROUTE' ? 'Маршрут' : lastMessage.text,
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
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Тендеры', url: '/owner/tenders' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Чаты', url: '/owner/chats' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    };

    return (
        <Layout title="Чаты" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>Чаты</h1>
                    <p style={{ color: '#666', marginTop: '8px' }}>Общение с перевозчиками по заявкам</p>
                </div>
                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#666' }}>
                        <div style={{ marginBottom: '16px' }}>Загрузка...</div>
                        Загрузка чатов...
                    </div>
                ) : (
                    <div className={chatStyles.chatsContainer}>
                        {/* Левая панель со списком чатов */}
                        <div className={chatStyles.chatsList}>
                            <div className={chatStyles.chatsListHeader}>
                                <h2>Чаты</h2>
                                <p>{requests.length} {requests.length === 1 ? 'чат' : 'чатов'}</p>
                            </div>
                            <div className={chatStyles.chatsListContent}>
                                {requests.length === 0 ? (
                                    <div className={chatStyles.emptyChats}>
                                        <div className={chatStyles.emptyIcon}></div>
                                        <h3>Нет активных чатов</h3>
                                        <p>Чаты появятся, когда перевозчик примет вашу заявку</p>
                                    </div>
                                ) : (
                                    requests.map((request) => (
                                        <div
                                            key={request.id}
                                            className={`${chatStyles.chatItem} ${chatRequestId === request.id ? chatStyles.active : ''}`}
                                            onClick={() => {
                                                setChatRequestId(request.id);
                                                setShowChat(true);
                                            }}
                                        >
                                            <div className={chatStyles.chatItemHeader}>
                                                <h3>Заявка #{request.id}</h3>
                                                <span
                                                    className={chatStyles.chatStatus}
                                                    data-status={getStatusKey(request.status)}
                                                >
                                                    {getStatusLabel(request.status)}
                                                </span>
                                            </div>
                                            <div className={chatStyles.chatItemInfo}>
                                                <p><strong>Груз:</strong> {request.cargo?.name}</p>
                                                {request.carrierName && (
                                                    <p><strong>Перевозчик:</strong> {request.carrierName}</p>
                                                )}
                                            </div>
                                            {request.lastMessage && (
                                                <div className={chatStyles.chatItemLastMessage}>
                                                    <p className={chatStyles.lastMessageText}>
                                                        {request.lastMessage.text.length > 40
                                                            ? request.lastMessage.text.substring(0, 40) + '...'
                                                            : request.lastMessage.text}
                                                    </p>
                                                    <p className={chatStyles.lastMessageTime}>
                                                        {new Date(request.lastMessage.createdAt).toLocaleString('ru-RU', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Правая панель с чатом */}
                        <div className={chatStyles.chatView}>
                            {showChat && chatRequestId && currentUserId > 0 ? (
                                <RequestChat
                                    requestId={chatRequestId}
                                    currentUserId={currentUserId}
                                    isOwner={true}
                                    onClose={() => {
                                        setShowChat(false);
                                        setChatRequestId(null);
                                        fetchChats();
                                    }}
                                    isEmbedded={true}
                                />
                            ) : (
                                <div className={chatStyles.chatViewEmpty}>
                                    <div className={chatStyles.emptyIcon}></div>
                                    <h3>Выберите чат</h3>
                                    <p>Выберите чат из списка слева, чтобы начать общение</p>
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

export default OwnerChatsPage;

