import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/UserManagement.module.sass';
import cn from 'classnames';
import { authService } from '../../services/authService';

interface Client {
    id: number;
    userId: number;
    fullName: string;
    phoneNumber: string;
    isBlocked: boolean;
    blocked?: boolean;
}

const UserManagement: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchClients = async () => {
        try {
            const token = authService.getToken();
            const role = authService.getRole();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (role !== 'ADMIN') {
                throw new Error('Требуются права администратора');
            }

            const response = await fetch('http://localhost:8080/secured/admin/users', {
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

            const processedData = data.map((client: any) => ({
                ...client,
                isBlocked: client.isBlocked ?? client.blocked ?? false
            }));

            setClients(processedData);
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

            await fetchClients();
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

            await fetchClients();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        }
    };

    useEffect(() => {
        fetchClients();
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
                    {clients.map(client => {
                        console.log('ID клиента:', client.id);
                        return (
                            <tr key={client.id}>
                                <td>{client.id}</td>
                                <td>{client.fullName}</td>
                                <td>{client.phoneNumber}</td>
                                <td>
                                    <span className={cn(styles.status, {
                                        [styles.blocked]: client.isBlocked,
                                        [styles.active]: !client.isBlocked
                                    })}>
                                        {client.isBlocked ? 'Заблокирован' : 'Активен'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={cn(styles.actionButton, {
                                            [styles.blockButton]: !client.isBlocked,
                                            [styles.unblockButton]: client.isBlocked
                                        })}
                                        onClick={() => client.isBlocked ? handleUnblockClient(client.id) : handleBlockClient(client.id)}
                                    >
                                        {client.isBlocked ? 'Разблокировать' : 'Заблокировать'}
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