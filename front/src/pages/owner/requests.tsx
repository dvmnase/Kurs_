import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
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

const OwnerRequestsPage = () => {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<Request | null>(null);
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
        fetchRequests();
        fetchCargos();
    }, []);

    const fetchCargos = async () => {
        try {
            const response = await api.get('/api/owner/cargo');
            setCargos(response.data);
        } catch (err: any) {
            console.error('Ошибка при загрузке грузов:', err);
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
        setFormData({
            cargoId: request.cargoId.toString(),
            carrierId: '',
            pickupDate: request.pickupDate || '',
            deliveryDate: request.deliveryDate || '',
            comment: request.comment || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;
        try {
            await api.put(`/api/owner/requests/${editingRequest.id}`, {
                pickupDate: formData.pickupDate || null,
                deliveryDate: formData.deliveryDate || null,
                comment: formData.comment
            });
            setShowEditModal(false);
            setEditingRequest(null);
            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' });
            fetchRequests();
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при обновлении заявки');
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
            { title: 'Маршруты', url: '/owner/routes' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    };

    return (
        <Layout navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Управление заявками</h1>
                {error && <div className={styles.error}>{error}</div>}
                <button onClick={() => setShowCreateModal(true)}>Создать заявку</button>
                
                {showCreateModal && (
                    <div className={styles.modal}>
                        <form onSubmit={handleCreateRequest}>
                            <h2>Создать заявку</h2>
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
                            <input
                                type="number"
                                placeholder="ID перевозчика (опционально)"
                                value={formData.carrierId}
                                onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                            />
                            <input
                                type="date"
                                placeholder="Дата забора"
                                value={formData.pickupDate}
                                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                            />
                            <input
                                type="date"
                                placeholder="Дата доставки"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            />
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

                {showEditModal && editingRequest && (
                    <div className={styles.modal}>
                        <form onSubmit={handleUpdateRequest}>
                            <h2>Редактировать заявку #{editingRequest.id}</h2>
                            <input
                                type="date"
                                placeholder="Дата забора"
                                value={formData.pickupDate}
                                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                            />
                            <input
                                type="date"
                                placeholder="Дата доставки"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            />
                            <textarea
                                placeholder="Комментарий"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            />
                            <button type="submit">Сохранить</button>
                            <button type="button" onClick={() => {
                                setShowEditModal(false);
                                setEditingRequest(null);
                            }}>Отмена</button>
                        </form>
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
                                {request.pickupDate && <p>Дата забора: {request.pickupDate}</p>}
                                {request.deliveryDate && <p>Дата доставки: {request.deliveryDate}</p>}
                                {request.comment && <p>Комментарий: {request.comment}</p>}
                                <div>
                                    <button onClick={() => handleEditRequest(request)}>Редактировать</button>
                                    <button onClick={() => handleDeleteRequest(request.id)}>Удалить</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerRequestsPage;

