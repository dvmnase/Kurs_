import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/UserManagement.module.sass';
import cn from 'classnames';
import { authService } from '../../services/authService';

interface Account {
    id: number;
    userId: number;
    accountNumber: string;
    type: string;
    balance: number;
    status: string;
    ownerName: string;
}

const AccountManagement: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');

    const fetchAccounts = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            let url = 'http://localhost:8080/secured/admin/accounts';
            if (filter === 'active') {
                url += '/active';
            } else if (filter === 'blocked') {
                url += '/blocked';
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении счетов');
            }

            const data = await response.json();
            console.log('Полученные данные счетов:', data);
            setAccounts(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [filter]);

    const handleBlockAccount = async (accountId: number) => {
        if (window.confirm('Вы уверены, что хотите заблокировать этот счет?')) {
            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Токен не найден');
                }

                const response = await fetch(`http://localhost:8080/secured/admin/accounts/${accountId}/block`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при блокировке счета');
                }

                fetchAccounts();
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Ошибка при блокировке счета');
            }
        }
    };

    const handleUnblockAccount = async (accountId: number) => {
        if (window.confirm('Вы уверены, что хотите разблокировать этот счет?')) {
            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Токен не найден');
                }

                const response = await fetch(`http://localhost:8080/secured/admin/accounts/${accountId}/unblock`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Ошибка при разблокировке счета');
                }

                fetchAccounts();
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Ошибка при разблокировке счета');
            }
        }
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <h1>Управление счетами</h1>
            <div className={styles.filters}>
                <button 
                    className={cn(styles.filterButton, { [styles.active]: filter === 'all' })}
                    onClick={() => setFilter('all')}
                >
                    Все счета
                </button>
                <button 
                    className={cn(styles.filterButton, { [styles.active]: filter === 'active' })}
                    onClick={() => setFilter('active')}
                >
                    Активные
                </button>
                <button 
                    className={cn(styles.filterButton, { [styles.active]: filter === 'blocked' })}
                    onClick={() => setFilter('blocked')}
                >
                    Заблокированные
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Номер счета</th>
                        <th>Владелец</th>
                        <th>Тип</th>
                        <th>Баланс</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => (
                        <tr key={account.id}>
                            <td>{account.id}</td>
                            <td>{account.accountNumber}</td>
                            <td>{account.ownerName}</td>
                            <td>{account.type}</td>
                            <td>{account.balance} ₽</td>
                            <td>
                                <span className={cn(styles.status, {
                                    [styles.blocked]: account.status === 'BLOCKED',
                                    [styles.active]: account.status === 'ACTIVE'
                                })}>
                                    {account.status === 'ACTIVE' ? 'Активен' : 'Заблокирован'}
                                </span>
                            </td>
                            <td>
                                <button
                                    className={cn(styles.actionButton, {
                                        [styles.blockButton]: account.status === 'ACTIVE',
                                        [styles.unblockButton]: account.status === 'BLOCKED'
                                    })}
                                    onClick={() => account.status === 'ACTIVE' 
                                        ? handleBlockAccount(account.id) 
                                        : handleUnblockAccount(account.id)}
                                >
                                    {account.status === 'ACTIVE' ? 'Заблокировать' : 'Разблокировать'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AccountManagement; 