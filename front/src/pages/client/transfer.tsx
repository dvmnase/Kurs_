import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import Layout from '../../components/Layout';
import styles from '../../styles/client/Transfer.module.sass';

interface Account {
    id: number;
    accountNumber: string;
    type: 'CURRENT' | 'DEPOSIT' | 'CURRENCY';
    balance: number;
    status: 'ACTIVE' | 'BLOCKED';
}

interface Transaction {
    id: number;
    fromAccountId: number;
    toAccountId: number | null;
    toExternal: string | null;
    amount: number;
    type: 'INTERNAL' | 'EXTERNAL';
    createdAt: string;
}

const TransferPage = () => {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showExternalTransferModal, setShowExternalTransferModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [transferData, setTransferData] = useState({
        fromAccountId: '',
        toAccountId: '',
        toExternalAccount: '',
        amount: ''
    });
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isClient()) {
            router.push('/');
            return;
        }
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions(selectedAccount.id);
        }
    }, [selectedAccount, dateRange]);

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
            setAccounts(data);
            if (data.length > 0) {
                setSelectedAccount(data[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при загрузке счетов');
        }
    };

    const fetchTransactions = async (accountId: number) => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            let url = `http://localhost:8080/api/accounts/${accountId}/transactions`;
            if (dateRange.startDate || dateRange.endDate) {
                url += '/filter';
                const params = new URLSearchParams();
                if (dateRange.startDate) {
                    const startDate = new Date(dateRange.startDate);
                    params.append('startDate', startDate.toISOString());
                }

                if (dateRange.endDate) {
                    const endDate = new Date(dateRange.endDate);
                    params.append('endDate', endDate.toISOString());
                }
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке транзакций');
            }

            const data = await response.json();
            setTransactions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleInternalTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/accounts/transfer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAccountId: parseInt(transferData.fromAccountId),
                    toAccountId: parseInt(transferData.toAccountId),
                    amount: parseFloat(transferData.amount)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании перевода');
            }

            setSuccess('Перевод успешно выполнен');
            setShowTransferModal(false);
            setTransferData({
                fromAccountId: '',
                toAccountId: '',
                toExternalAccount: '',
                amount: ''
            });
            await fetchAccounts();
            if (selectedAccount) {
                await fetchTransactions(selectedAccount.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании перевода');
        }
    };

    const handleExternalTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/accounts/external-transfer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAccountId: parseInt(transferData.fromAccountId),
                    toExternalAccount: transferData.toExternalAccount,
                    amount: parseFloat(transferData.amount)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании внешнего перевода');
            }

            setSuccess('Внешний перевод успешно выполнен');
            setShowExternalTransferModal(false);
            setTransferData({
                fromAccountId: '',
                toAccountId: '',
                toExternalAccount: '',
                amount: ''
            });
            await fetchAccounts();
            if (selectedAccount) {
                await fetchTransactions(selectedAccount.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании внешнего перевода');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    };

    const getTransactionTypeText = (type: string) => {
        switch (type) {
            case 'INTERNAL': return 'Внутренний перевод';
            case 'EXTERNAL': return 'Внешний перевод';
            default: return type;
        }
    };

    const getAccountTypeText = (type: string) => {
        switch (type) {
            case 'CURRENT': return 'Текущий счет';
            case 'DEPOSIT': return 'Депозитный счет';
            case 'CURRENCY': return 'Валютный счет';
            default: return type;
        }
    };

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <Layout 
            title="Переводы"
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
                    <h1>Переводы</h1>
                    <div className={styles.actions}>
                        <button
                            className={styles.transferButton}
                            onClick={() => setShowTransferModal(true)}
                        >
                            Перевод между счетами
                        </button>
                        <button
                            className={styles.externalTransferButton}
                            onClick={() => setShowExternalTransferModal(true)}
                        >
                            Внешний перевод
                        </button>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.filters}>
                    <div className={styles.accountSelector}>
                        <label>Выберите счет:</label>
                        <select
                            value={selectedAccount?.id || ''}
                            onChange={(e) => {
                                const account = accounts.find(a => a.id === parseInt(e.target.value));
                                setSelectedAccount(account || null);
                            }}
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.accountNumber} - {getAccountTypeText(account.type)} - {formatAmount(account.balance)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.dateRange}>
                        <div className={styles.dateInput}>
                            <label>От:</label>
                            <input
                                type="datetime-local"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div className={styles.dateInput}>
                            <label>До:</label>
                            <input
                                type="datetime-local"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.transactionsList}>
                    {transactions.length === 0 ? (
                        <p>Нет транзакций</p>
                    ) : (
                        transactions.map((transaction) => (
                            <div key={transaction.id} className={styles.transactionCard}>
                                <div className={styles.cardHeader}>
                                    <h3>{getTransactionTypeText(transaction.type)}</h3>
                                </div>
                                <div className={styles.cardBody}>
                                    <p><strong>Сумма:</strong> {formatAmount(transaction.amount)}</p>
                                    <p><strong>От счета:</strong> {
                                        accounts.find(a => a.id === transaction.fromAccountId)?.accountNumber || 
                                        transaction.fromAccountId
                                    }</p>
                                    {transaction.type === 'INTERNAL' ? (
                                        <p><strong>К счету:</strong> {
                                            accounts.find(a => a.id === transaction.toAccountId)?.accountNumber || 
                                            transaction.toAccountId
                                        }</p>
                                    ) : (
                                        <p><strong>К счету:</strong> {transaction.toExternal}</p>
                                    )}
                                    <p><strong>Дата:</strong> {formatDate(transaction.createdAt)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showTransferModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Перевод между счетами</h2>
                            <form onSubmit={handleInternalTransfer}>
                                <div className={styles.formGroup}>
                                    <label>Счет отправителя</label>
                                    <select
                                        value={transferData.fromAccountId}
                                        onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts
                                            .filter(account => account.status === 'ACTIVE')
                                            .map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.accountNumber} - {getAccountTypeText(account.type)} - {formatAmount(account.balance)}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Счет получателя</label>
                                    <select
                                        value={transferData.toAccountId}
                                        onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts
                                            .filter(account => account.status === 'ACTIVE')
                                            .map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.accountNumber} - {getAccountTypeText(account.type)} - {formatAmount(account.balance)}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Сумма</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={transferData.amount}
                                        onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setShowTransferModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" className={styles.submitButton}>
                                        Выполнить перевод
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showExternalTransferModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Внешний перевод</h2>
                            <form onSubmit={handleExternalTransfer}>
                                <div className={styles.formGroup}>
                                    <label>Счет отправителя</label>
                                    <select
                                        value={transferData.fromAccountId}
                                        onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                                        required
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts
                                            .filter(account => account.status === 'ACTIVE')
                                            .map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.accountNumber} - {getAccountTypeText(account.type)} - {formatAmount(account.balance)}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Номер счета получателя</label>
                                    <input
                                        type="text"
                                        value={transferData.toExternalAccount}
                                        onChange={(e) => setTransferData({ ...transferData, toExternalAccount: e.target.value })}
                                        required
                                        placeholder="Введите номер счета получателя"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Сумма</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={transferData.amount}
                                        onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setShowExternalTransferModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" className={styles.submitButton}>
                                        Выполнить перевод
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TransferPage; 