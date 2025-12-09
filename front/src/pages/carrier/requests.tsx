import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
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
}

const CarrierRequestsPage = () => {
    const router = useRouter();
    const [myRequests, setMyRequests] = useState<Request[]>([]);
    const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
    const [activeTab, setActiveTab] = useState<'my' | 'available'>('available');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isCarrier()) {
            router.push('/');
            return;
        }
        fetchRequests();
    }, []);

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

    const navigation = {
        menu: [
            { title: 'Заявки', url: '/carrier/requests' },
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
                                {activeTab === 'available' && (request.status === 'NEW' || request.status === 'PENDING') ? (
                                    <div>
                                        <button onClick={() => handleAcceptRequest(request.id)}>Принять</button>
                                        <button onClick={() => handleDeclineRequest(request.id)}>Отклонить</button>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                        {(activeTab === 'available' ? availableRequests : myRequests).length === 0 && (
                            <div>Нет заявок</div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CarrierRequestsPage;
