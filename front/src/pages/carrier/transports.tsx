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

    const handleDeleteTransport = async (id: number) => {
        if (!confirm('Удалить транспорт?')) return;
        try {
            await api.delete(`/api/carrier/transports/${id}`);
            fetchTransports();
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при удалении транспорта');
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
            { title: 'Тендеры', url: '/carrier/tenders' },
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
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '4px solid #4caf50' }}>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#1b5e20', letterSpacing: '-0.5px', lineHeight: '1.3' }}>Добавить транспорт</h2>
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
                                <form onSubmit={handleCreateTransport}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: '8px', fontSize: '15px' }}>
                                            Тип транспорта (обязательное поле) — укажите тип транспортного средства
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Например: Грузовик, Фура, Автобус..."
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            required
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
                                            Номер (обязательное поле) — государственный номер транспортного средства
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Например: А123БВ777"
                                            value={formData.numberPlate}
                                            onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })}
                                            required
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
                                            Грузоподъемность (опционально) — максимальная грузоподъемность в тоннах
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Введите грузоподъемность в тоннах..."
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            min="0"
                                            step="0.1"
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

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {transports.map((transport) => (
                            <div key={transport.id} className={styles.item}>
                                <h3>{transport.type}</h3>
                                <p>Номер: {transport.numberPlate}</p>
                                {transport.capacity && <p>Грузоподъемность: {transport.capacity} т</p>}
                                <div className={styles.transportActions}>
                                    <button
                                        type="button"
                                        className={styles.deleteTransportButton}
                                        onClick={() => handleDeleteTransport(transport.id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CarrierTransportsPage;




