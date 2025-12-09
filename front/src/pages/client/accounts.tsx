import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import Layout from '../../components/Layout';
import styles from '../../styles/client/Accounts.module.sass';

interface Account {
    id: number;
    accountNumber: string;
    balance: number;
    status: 'ACTIVE' | 'CLOSED' | 'BLOCKED';
    type: 'DEPOSIT' | 'CURRENT' | 'CURRENCY';
}

const AccountsPage = () => {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [newAccountType, setNewAccountType] = useState<'DEPOSIT' | 'CURRENT' | 'CURRENCY'>('CURRENT');

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isClient()) {
            router.push('/');
            return;
        }
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            setError(null);
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
            setAccounts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        try {
            setError(null);
            setSuccess(null);
            const token = authService.getToken();
    
            if (!token) {
                throw new Error('Требуется авторизация');
            }
    
            const response = await fetch('http://localhost:8080/api/accounts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: newAccountType
                })
            });
    
            if (!response.ok) {
                throw new Error('Ошибка при создании счета');
            }
    
            setSuccess('Счет успешно создан');
            setShowCreateModal(false);
            setNewAccountType('CURRENT');
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании счета');
        }
    };

    const handleCloseAccount = async () => {
        if (!selectedAccount) return;

        try {
            setError(null);
            setSuccess(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/accounts/${selectedAccount.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при закрытии счета');
            }

            setSuccess('Счет успешно закрыт');
            setShowCloseModal(false);
            setSelectedAccount(null);
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при закрытии счета');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(balance);
    };

    const getAccountTypeText = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
                return 'Депозитный';
            case 'CURRENT':
                return 'Текущий';
            case 'CURRENCY':
                return 'Валютный';
            default:
                return type;
        }
    };

    const navigation = {
        menu: [
            {
                title: 'Счета',
                url: '/client/accounts',
            },
            {
                title: 'Заявки',
                url: '/client/applications',
            },
            {
                title: 'Перевод средств',
                url: '/client/transfer',
            },
            {
                title: 'О нас',
                url: '/client#footer',
            },
        ],
    };

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <Layout 
            title="Счета"
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
                    <h1>Управление счетами</h1>
                    <button
                        className={styles.createButton}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Создать новый счет
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.accountsList}>
                    {accounts.length === 0 ? (
                        <p>У вас пока нет счетов</p>
                    ) : (
                        accounts.map((account) => (
                            <div key={account.id} className={styles.accountCard}>
                                <div className={styles.accountHeader}>
                                    <h3>Счет #{account.accountNumber}</h3>
                                    <span className={`${styles.status} ${styles[account.status.toLowerCase()]}`}>
                                        {account.status}
                                    </span>
                                </div>
                                <div className={styles.accountBody}>
                                    <p><strong>Баланс:</strong> {formatBalance(account.balance)}</p>
                                    <p><strong>Тип счета:</strong> {getAccountTypeText(account.type)}</p>
                                </div>
                                {account.status === 'ACTIVE' && (
                                    <div className={styles.accountActions}>
                                        <button
                                            className={styles.closeButton}
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setShowCloseModal(true);
                                            }}
                                        >
                                            Закрыть счет
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {showCreateModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Создание нового счета</h2>
                            <div className={styles.formGroup}>
                                <label>Тип счета:</label>
                                <select
                                    value={newAccountType}
                                    onChange={(e) => setNewAccountType(e.target.value as 'DEPOSIT' | 'CURRENT' | 'CURRENCY')}
                                    className={styles.select}
                                >
                                    <option value="CURRENT">Текущий счет</option>
                                    <option value="DEPOSIT">Депозитный счет</option>
                                    <option value="CURRENCY">Валютный счет</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.confirmButton}
                                    onClick={handleCreateAccount}
                                >
                                    Создать
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewAccountType('CURRENT');
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showCloseModal && selectedAccount && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Закрытие счета</h2>
                            <p>Вы уверены, что хотите закрыть счет #{selectedAccount.accountNumber}?</p>
                            <p>Баланс: {formatBalance(selectedAccount.balance)}</p>
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setShowCloseModal(false);
                                        setSelectedAccount(null);
                                    }}
                                >
                                    Отмена
                                </button>
                                <button
                                    className={styles.confirmButton}
                                    onClick={handleCloseAccount}
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

export default AccountsPage; 