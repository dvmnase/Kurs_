import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import AppLink from '../../components/AppLink';
import styles from '../../styles/client/ClientHome.module.sass';
import { getStatusKey, getStatusLabel } from '../../utils/statusLabels';

interface TenderBid {
    id: number;
    carrierId: number;
    carrierName: string;
    price: number;
    deliveryDate: string;
    comment?: string;
    status: string;
}

interface Tender {
    id: number;
    cargoId: number;
    cargoName: string;
    status: string;
    endAt: string;
    conditions?: string;
    expectedPrice?: number;
    bidsCount: number;
    requestId?: number;
    bids?: TenderBid[];
}

const OwnerTendersPage = () => {
    const router = useRouter();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/');
            return;
        }
        fetchTenders();
    }, []);

    const fetchTenders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/owner/tenders');
            setTenders(response.data);
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Ошибка при загрузке тендеров');
        } finally {
            setLoading(false);
        }
    };

    const openTenderDetail = async (tenderId: number) => {
        try {
            setLoadingDetail(true);
            setError(null);
            setSuccessMessage(null);
            const response = await api.get(`/api/owner/tenders/${tenderId}`);
            setSelectedTender(response.data);
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Ошибка при загрузке тендера');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleAcceptBid = async (tenderId: number, bidId: number) => {
        if (!confirm('Принять это предложение? Остальные предложения будут отклонены, тендер закроется.')) {
            return;
        }
        try {
            setError(null);
            setSuccessMessage(null);
            const response = await api.post(`/api/owner/tenders/${tenderId}/bids/${bidId}/accept`);
            setSelectedTender(response.data);
            fetchTenders();
            const requestId = response.data?.requestId;
            setSuccessMessage(
                requestId
                    ? `Предложение принято. Создана заявка №${requestId}.`
                    : 'Предложение принято. Тендер закрыт.'
            );
        } catch (err: any) {
            const msg = err.response?.data;
            setError(typeof msg === 'string' ? msg : 'Ошибка при принятии предложения');
        }
    };

    const formatDate = (value: string) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU');
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
        <Layout title="Тендеры" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>Тендеры</h1>
                    <p style={{ color: '#666', marginTop: '8px' }}>
                        Управляйте открытыми тендерами и выбирайте лучшие предложения перевозчиков
                    </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {successMessage && (
                    <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#e8f5e9', borderRadius: '8px', color: '#2e7d32' }}>
                        {successMessage}{' '}
                        <AppLink href="/owner/requests" className="">Перейти к заявкам</AppLink>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
                ) : tenders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                        <p>Нет тендеров. Откройте тендер на странице «Мои грузы».</p>
                        <AppLink href="/owner/cargo" className="">Перейти к грузам</AppLink>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {tenders.map((tender) => (
                            <div key={tender.id} className={styles.item}>
                                <h3>Тендер №{tender.id} — {tender.cargoName}</h3>
                                <p>
                                    <strong>Статус:</strong>{' '}
                                    <span data-status={getStatusKey(tender.status)}>{getStatusLabel(tender.status)}</span>
                                </p>
                                <p><strong>Окончание:</strong> {formatDate(tender.endAt)}</p>
                                {tender.expectedPrice != null && (
                                    <p><strong>Ожидаемая цена:</strong> {tender.expectedPrice} руб.</p>
                                )}
                                <p><strong>Предложений:</strong> {tender.bidsCount}</p>
                                {tender.requestId != null && (
                                    <p>
                                        <strong>Заявка:</strong>{' '}
                                        <AppLink href="/owner/requests" className="">№{tender.requestId}</AppLink>
                                    </p>
                                )}
                                <div className={styles.buttonGroup}>
                                    <button type="button" onClick={() => openTenderDetail(tender.id)}>
                                        {tender.status === 'OPEN' ? 'Смотреть предложения' : 'Подробнее'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedTender && (
                    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelectedTender(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h2>Тендер №{selectedTender.id}</h2>
                                <button type="button" onClick={() => setSelectedTender(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                            </div>
                            {loadingDetail ? (
                                <p>Загрузка...</p>
                            ) : (
                                <>
                                    <p><strong>Груз:</strong> {selectedTender.cargoName}</p>
                                    <p>
                                        <strong>Статус:</strong>{' '}
                                        <span data-status={getStatusKey(selectedTender.status)}>{getStatusLabel(selectedTender.status)}</span>
                                    </p>
                                    {selectedTender.conditions && <p><strong>Условия:</strong> {selectedTender.conditions}</p>}
                                    {selectedTender.requestId != null && (
                                        <p>
                                            <strong>Заявка:</strong>{' '}
                                            <AppLink href="/owner/requests" className="">№{selectedTender.requestId}</AppLink>
                                        </p>
                                    )}
                                    <h3 style={{ marginTop: '20px' }}>Предложения перевозчиков</h3>
                                    {!selectedTender.bids?.length ? (
                                        <p style={{ color: '#666' }}>Пока нет предложений</p>
                                    ) : (
                                        <div className={styles.list}>
                                            {selectedTender.bids.map((bid) => (
                                                <div key={bid.id} className={styles.item} style={{ marginBottom: '12px' }}>
                                                    <p><strong>{bid.carrierName}</strong></p>
                                                    <p>Цена: {bid.price} руб.</p>
                                                    <p>Доставка: {bid.deliveryDate}</p>
                                                    {bid.comment && <p>Комментарий: {bid.comment}</p>}
                                                    <p>
                                                        Статус:{' '}
                                                        <span data-status={getStatusKey(bid.status)}>{getStatusLabel(bid.status)}</span>
                                                    </p>
                                                    {selectedTender.status === 'OPEN' && bid.status === 'PENDING' && (
                                                        <button type="button" onClick={() => handleAcceptBid(selectedTender.id, bid.id)}>
                                                            Принять предложение
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default OwnerTendersPage;
