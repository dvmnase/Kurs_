import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import Layout from '../../components/Layout';
import styles from '../../styles/client/Applications.module.sass';
import { getStatusKey, getStatusLabel } from '../../utils/statusLabels';

interface Application {
    id: number;
    type: string;
    status: 'NEW' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    comment?: string;
    accountId?: number;
}

interface Account {
    id: number;
    accountNumber: string;
    balance: number;
    currency: string;
    status: string;
}

const ApplicationsPage = () => {
    const router = useRouter();
    const { id } = router.query; // Получаем ID заявки из URL
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showCardModal, setShowCardModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [cardData, setCardData] = useState({
        accountId: '',
        comment: '',
        cardType: 'DEBIT'
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isClient()) {
            router.push('/');
            return;
        }
        fetchApplications();
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (id) {
            fetchApplicationById(Number(id));
        }
    }, [id]);

    const fetchApplicationById = async (applicationId: number) => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/applications/${applicationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Заявка не найдена');
                }
                throw new Error('Ошибка при загрузке заявки');
            }

            const data = await response.json();
            setSelectedApplication(data);
            setShowDetailsModal(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/applications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке заявок');
            }

            const data = await response.json();
            setApplications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/accounts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке счетов');
            }

            const data = await response.json();
            // Filter only active accounts
            const activeAccounts = data.filter((account: Account) => account.status === 'ACTIVE');
            setAccounts(activeAccounts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при загрузке счетов');
        }
    };

    const handleCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = authService.getToken();
    
            if (!token) {
                throw new Error('Требуется авторизация');
            }
    
            const response = await fetch('http://localhost:8080/api/applications/card', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountId: parseInt(cardData.accountId),
                    comment: cardData.comment || `Запрос на выпуск ${cardData.cardType} карты`
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании заявки');
            }
    
            setSuccess('Заявка на выпуск карты успешно создана');
            setShowCardModal(false);
            setCardData({
                accountId: '',
                comment: '',
                cardType: 'DEBIT'
            });
            await fetchApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании заявки');
        }
    };

    const getCardTypeText = (type: string) => {
        switch (type) {
            case 'DEBIT': return 'Дебетовая';
            case 'CREDIT': return 'Кредитная';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    };

    return (
        <Layout 
            title="Заявки"
            navigationPaths={{
                menu: [
                    { title: 'Мои счета', url: '/client/accounts' },
                    { title: 'Заявки', url: '/client/applications' },
                    { title: 'Переводы', url: '/client/transfer' },
                    {title: 'О нас', url: '/client#footer'}
                ]
            }}
            showLogout={true}
            onLogout={() => {
                localStorage.removeItem('token');
                router.push('/');
            }}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Заявки</h1>
                    <button
                        className={styles.cardButton}
                        onClick={() => setShowCardModal(true)}
                    >
                        Заказать карту
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.applicationsList}>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : applications.length === 0 ? (
                        <p>У вас пока нет заявок</p>
                    ) : (
                        applications.map((application) => (
                            <div 
                                key={application.id} 
                                className={styles.applicationCard}
                                onClick={() => {
                                    router.push(`/client/applications?id=${application.id}`);
                                }}
                            >
                                <div className={styles.cardHeader}>
                                    <h3>Заявка #{application.id}</h3>
                                    <span
                                        className={`${styles.status} ${styles[application.status.toLowerCase()]}`}
                                        data-status={getStatusKey(application.status)}
                                    >
                                        {getStatusLabel(application.status)}
                                    </span>
                                </div>
                                <div className={styles.cardBody}>
                                    <p><strong>Тип заявки:</strong> Выпуск карты</p>
                                    {application.comment && <p><strong>Комментарий:</strong> {application.comment}</p>}
                                    {application.accountId && (
                                        <p><strong>Счет:</strong> {
                                            accounts.find(a => a.id === application.accountId)?.accountNumber || 
                                            application.accountId
                                        }</p>
                                    )}
                                    <p><strong>Дата:</strong> {formatDate(application.createdAt)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showCardModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Заявка на выпуск карты</h2>
                            <form onSubmit={handleCardSubmit}>
                                <div className={styles.formGroup}>
                                    <label>Счет</label>
                                    <select
                                        value={cardData.accountId}
                                        onChange={(e) => setCardData({ ...cardData, accountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.accountNumber} - {account.currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Тип карты</label>
                                    <select
                                        value={cardData.cardType}
                                        onChange={(e) => setCardData({ ...cardData, cardType: e.target.value })}
                                        required
                                    >
                                        <option value="DEBIT">Дебетовая</option>
                                        <option value="CREDIT">Кредитная</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Комментарий (необязательно)</label>
                                    <input
                                        type="text"
                                        value={cardData.comment}
                                        onChange={(e) => setCardData({ ...cardData, comment: e.target.value })}
                                    />
                                </div>
                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setShowCardModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" className={styles.submitButton}>
                                        Создать заявку
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDetailsModal && selectedApplication && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Детали заявки #{selectedApplication.id}</h2>
                            <div className={styles.detailsContent}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Статус:</span>
                                    <span
                                        className={`${styles.status} ${styles[selectedApplication.status.toLowerCase()]}`}
                                        data-status={getStatusKey(selectedApplication.status)}
                                    >
                                        {getStatusLabel(selectedApplication.status)}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Тип заявки:</span>
                                    <span>Выпуск карты</span>
                                </div>
                                {selectedApplication.comment && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Комментарий:</span>
                                        <span>{selectedApplication.comment}</span>
                                    </div>
                                )}
                                {selectedApplication.accountId && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Счет:</span>
                                        <span>
                                            {accounts.find(a => a.id === selectedApplication.accountId)?.accountNumber || 
                                            selectedApplication.accountId}
                                        </span>
                                    </div>
                                )}
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Дата создания:</span>
                                    <span>{formatDate(selectedApplication.createdAt)}</span>
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedApplication(null);
                                        router.push('/client/applications');
                                    }}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ApplicationsPage;
