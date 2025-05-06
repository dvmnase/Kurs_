import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/components/EmployeeDashboard.module.sass';
import { authService } from '../../services/authService';
import Header from '../../components/Header';

interface Application {
    id: number;
    status: string;
    userId: number;
    type: string;
    accountId: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
    account: {
        id: number;
        accountNumber: string;
        balance: number;
        status: string;
    };
    client: {
        id: number;
        fullName: string;
        phoneNumber: string;
        email: string;
        blocked: boolean;
    };
}

const EmployeeDashboard = () => {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isEmployee()) {
            router.push('');
            return;
        }
        fetchApplications();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/employee/applications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке заявок');
            }

            const data = await response.json();
            setApplications(data);
            console.log('Заявки сотрудника:', data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке заявок');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
        try {
            setError(null);
            setSuccessMessage(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/employee/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    authService.logout();
                    router.push('/');
                    return;
                }
                throw new Error('Ошибка при обновлении статуса заявки');
            }

            setSuccessMessage('Статус заявки успешно обновлен');
            await fetchApplications();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка при обновлении статуса заявки');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'Ожидает';
            case 'IN_PROGRESS':
                return 'В работе';
            case 'COMPLETED':
                return 'Завершена';
            case 'CANCELLED':
                return 'Отменена';
            default:
                return status;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'OPEN_ACCOUNT':
                return 'Открытие счета';
            case 'CLOSE_ACCOUNT':
                return 'Закрытие счета';
            case 'TRANSFER':
                return 'Перевод';
            case 'LOAN':
                return 'Кредит';
            default:
                return type;
        }
    };

    const filteredApplications = applications.filter(app => {
        if (filter === 'ALL') return true;
        return app.status === filter;
    });

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    return (
      <>
          <Header
            navigation={[]}
            showLogout={true}
            onLogout={() => {
                authService.logout();
                router.push('/');
            }}
          />
          <div className={styles.container}>
              <div className={styles.header}>
                  <h2 className={styles.title}>Панель управления сотрудника</h2>
                  <div className={styles.filters}>
                      <button
                        className={`${styles.filterButton} ${filter === 'ALL' ? styles.active : ''}`}
                        onClick={() => setFilter('ALL')}
                      >
                          Все заявки
                      </button>
                      <button
                        className={`${styles.filterButton} ${filter === 'PENDING' ? styles.active : ''}`}
                        onClick={() => setFilter('PENDING')}
                      >
                          Ожидающие
                      </button>
                      <button
                        className={`${styles.filterButton} ${filter === 'IN_PROGRESS' ? styles.active : ''}`}
                        onClick={() => setFilter('IN_PROGRESS')}
                      >
                          В работе
                      </button>
                      <button
                        className={`${styles.filterButton} ${filter === 'COMPLETED' ? styles.active : ''}`}
                        onClick={() => setFilter('COMPLETED')}
                      >
                          Завершенные
                      </button>
                  </div>
              </div>

              {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                </div>
              )}

              {error && (
                <div className={styles.error}>
                    {error}
                </div>
              )}

              <div className={styles.applicationsList}>
                  {filteredApplications.length === 0 ? (
                    <p className={styles.noApplications}>Нет доступных заявок</p>
                  ) : (
                    filteredApplications.map((app) => (
                      <div key={app.id} className={styles.applicationCard}>
                          <div className={styles.applicationHeader}>
                              <h3>Заявка #{app.id} - {getTypeText(app.type)}</h3>
                              <span className={styles.status}>{getStatusText(app.status)}</span>
                          </div>
                          <div className={styles.applicationDetails}>
                              <p><strong>Клиент:</strong> {app.client.fullName}</p>
                              <p><strong>Телефон:</strong> {app.client.phoneNumber}</p>
                              <p><strong>Email:</strong> {app.client.email}</p>
                              <p><strong>Счет:</strong> {app.account.accountNumber} (Баланс: {app.account.balance})</p>
                              <p><strong>Комментарий:</strong> {app.comment || 'Нет комментария'}</p>
                              <p><strong>Дата создания:</strong> {new Date(app.createdAt).toLocaleString()}</p>
                          </div>
                          <div className={styles.applicationActions}>
                              {app.status === 'PENDING' && (
                                <>
                                    <button
                                      className={styles.startButton}
                                      onClick={() => handleUpdateStatus(app.id, 'IN_PROGRESS')}
                                    >
                                        Принять в работу
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                                    >
                                        Отклонить
                                    </button>
                                </>
                              )}
                              {app.status === 'IN_PROGRESS' && (
                                <>
                                    <button
                                      className={styles.completeButton}
                                      onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                                    >
                                        Завершить
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                                    >
                                        Отменить
                                    </button>
                                </>
                              )}
                          </div>
                      </div>
                    ))
                  )}
              </div>
          </div>
      </>
    );
};

export default EmployeeDashboard;