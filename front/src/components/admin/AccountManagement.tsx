import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/UserManagement.module.sass';
import cn from 'classnames';
import { authService } from '../../services/authService';

interface Account {
    id: number;
    userId: number;
    fullName: string;
    phoneNumber: string;
    isBlocked: boolean;
    blocked?: boolean;
}

const UserManagement: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const token = authService.getToken();
            const role = authService.getRole();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (role !== 'ADMIN') {
                throw new Error('Требуются права администратора');
            }

            const response = await fetch('http://localhost:8080/secured/admin/users/clients', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Ошибка авторизации');
                } else if (response.status === 403) {
                    throw new Error('Доступ запрещен');
                } else {
                    throw new Error('Ошибка при получении данных');
                }
            }

            const data = await response.json();
            console.log('Полученные данные клиентов:', data);

            const processedData = data.map((account: any) => ({
                ...account,
                isBlocked: account.isBlocked ?? account.blocked ?? false
            }));

            setAccounts(processedData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockClient = async (clientId: number) => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            console.log('ID клиента:', clientId);


            const response = await fetch(`http://localhost:8080/secured/admin/users/clients/${clientId}/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при блокировке клиента');
            }

            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    const handleUnblockClient = async (userId: number) => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/secured/admin/users/clients/${userId}/unblock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при разблокировке клиента');
            }

            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <h1>Управление клиентами</h1>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Телефон</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => {
                        return (
                            <tr key={account.id}>
                                <td>{account.id}</td>
                                <td>{account.fullName}</td>
                                <td>{account.phoneNumber}</td>
                                <td>
                                    <span className={cn(styles.status, {
                                        [styles.blocked]: account.isBlocked,
                                        [styles.active]: !account.isBlocked
                                    })}>
                                        {account.isBlocked ? 'Заблокирован' : 'Активен'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={cn(styles.actionButton, {
                                            [styles.blockButton]: !account.isBlocked,
                                            [styles.unblockButton]: account.isBlocked
                                        })}
                                        onClick={() => account.isBlocked ? handleUnblockClient(account.id) : handleBlockClient(account.id)}
                                    >
                                        {account.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement; 