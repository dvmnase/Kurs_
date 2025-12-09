import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import styles from '../../styles/client/ClientHome.module.sass';

interface Transport {
    id: number;
    type: string;
    numberPlate: string;
    capacity: number;
}

const CarrierTransportsPage = () => {
    const router = useRouter();
    const [transports, setTransports] = useState<Transport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        numberPlate: '',
        capacity: ''
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isCarrier()) {
            router.push('/');
            return;
        }
        fetchTransports();
    }, []);

    const fetchTransports = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/carrier/transports');
            setTransports(response.data);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при загрузке транспорта');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/carrier/transports', {
                type: formData.type,
                numberPlate: formData.numberPlate,
                capacity: formData.capacity ? parseFloat(formData.capacity) : null
            });
            setShowCreateModal(false);
            setFormData({ type: '', numberPlate: '', capacity: '' });
            fetchTransports();
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при создании транспорта');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/api/carrier/transports/export', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'transports.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            setError('Ошибка при экспорте');
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
                <h1>Управление транспортом</h1>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actions}>
                    <button onClick={() => setShowCreateModal(true)}>Добавить транспорт</button>
                    <button onClick={handleExportExcel}>Экспорт в Excel</button>
                </div>
                
                {showCreateModal && (
                    <div className={styles.modal}>
                        <form onSubmit={handleCreateTransport}>
                            <h2>Добавить транспорт</h2>
                            <input
                                type="text"
                                placeholder="Тип транспорта"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Номер"
                                value={formData.numberPlate}
                                onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Грузоподъемность (тонны)"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                            <button type="submit">Создать</button>
                            <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {transports.map((transport) => (
                            <div key={transport.id} className={styles.item}>
                                <h3>{transport.type}</h3>
                                <p>Номер: {transport.numberPlate}</p>
                                {transport.capacity && <p>Грузоподъемность: {transport.capacity} т</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CarrierTransportsPage;


