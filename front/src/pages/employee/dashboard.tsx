import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/components/EmployeeDashboard.module.sass';
import { authService } from '../../services/authService';
import Header from '../../components/Header';

interface Application {
    id: number;
    userId: number;
    type: string;
    accountId: number;
    status: 'NEW' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
    comment: string;
    createdAt: string;
    updatedAt: string;
    account: {
        id: number;
        accountNumber: string;
        balance: number;
        status: string;
    };
    client?: {
        id: number;
        fullName: string;
        phoneNumber: string;
        email: string;
        blocked: boolean;
    } | null;
}

interface ApplicationStats {
    totalApplications: number;
    newApplications: number;
    inProgressApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    applicationsByType: Record<string, number>;
    applications: Application[];
}

const EmployeeDashboard = () => {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('ALL');
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [stats, setStats] = useState<ApplicationStats | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [searchId, setSearchId] = useState<string>('');

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isEmployee()) {
            router.push('/');
            return;
        }
        fetchApplications();
    }, [filter]);

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

            let url = 'http://localhost:8080/api/employee/applications';
            if (filter !== 'ALL') {
                url += `/stats?status=${filter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке заявок');
            }

            const data = await response.json();
            
            // Handle both regular applications list and stats response
            if (filter !== 'ALL') {
                // If we're using stats endpoint, data contains both stats and applications
                setStats(data);
                setApplications(data.applications || []);
            } else {
                // If we're using regular endpoint, data is just the applications list
                setApplications(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicationById = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/employee/applications/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке заявки');
            }

            const data = await response.json();
            setSelectedApplication(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при загрузке заявки');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicationStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/api/employee/applications/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке статистики');
            }

            const data = await response.json();
            setStats(data);
            setShowStats(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при загрузке статистики');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            setError(null);
            setSuccessMessage(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/employee/applications/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении статуса');
            }

            setSuccessMessage('Статус успешно обновлен');
            await fetchApplications();
            if (showStats) {
                await fetchApplicationStats();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при обновлении статуса');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'NEW': return 'Новая';
            case 'IN_PROGRESS': return 'В работе';
            case 'APPROVED': return 'Одобрена';
            case 'REJECTED': return 'Отклонена';
            default: return status;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'OPEN_ACCOUNT': return 'Открытие счета';
            case 'CLOSE_ACCOUNT': return 'Закрытие счета';
            case 'TRANSFER': return 'Перевод';
            case 'LOAN': return 'Кредит';
            default: return type;
        }
    };

    const handleSearch = async () => {
        if (!searchId.trim()) {
            await fetchApplications();
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch(`http://localhost:8080/api/employee/applications/${searchId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Заявка не найдена');
            }

            const data = await response.json();
            setApplications([data]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при поиске заявки');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

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
                  <h1>Панель управления сотрудника</h1>
                  <div className={styles.controls}>
                      <div className={styles.searchContainer}>
                          <input
                              type="text"
                              placeholder="Поиск по ID заявки"
                              value={searchId}
                              onChange={(e) => setSearchId(e.target.value)}
                              className={styles.searchInput}
                          />
                          <button
                              className={styles.searchButton}
                              onClick={handleSearch}
                          >
                              Найти
                          </button>
                      </div>
                  </div>
              </div>

              {showStats && stats && (
                <div className={styles.statsPanel}>
                    <h2>Статистика заявок</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <h3>Всего заявок</h3>
                            <p>{stats.totalApplications}</p>
                        </div>
                        <div className={styles.statItem}>
                            <h3>Новые</h3>
                            <p>{stats.newApplications}</p>
                        </div>
                        <div className={styles.statItem}>
                            <h3>В работе</h3>
                            <p>{stats.inProgressApplications}</p>
                        </div>
                        <div className={styles.statItem}>
                            <h3>Одобренные</h3>
                            <p>{stats.approvedApplications}</p>
                        </div>
                        <div className={styles.statItem}>
                            <h3>Отклоненные</h3>
                            <p>{stats.rejectedApplications}</p>
                        </div>
                    </div>
                    {stats.applicationsByType && Object.keys(stats.applicationsByType).length > 0 && (
                        <div className={styles.statsByType}>
                            <h3>Заявки по типам</h3>
                            {Object.entries(stats.applicationsByType).map(([type, count]) => (
                                <div key={type} className={styles.typeStat}>
                                    <span>{getTypeText(type)}:</span>
                                    <span>{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        className={styles.closeStats}
                        onClick={() => setShowStats(false)}
                    >
                        Закрыть статистику
                    </button>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}
              {successMessage && <div className={styles.success}>{successMessage}</div>}

              <div className={styles.statusSummary}>
                  <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Новые:</span>
                      <span className={styles.summaryCount}>{applications.filter(app => app.status === 'NEW').length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>В работе:</span>
                      <span className={styles.summaryCount}>{applications.filter(app => app.status === 'IN_PROGRESS').length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Одобренные:</span>
                      <span className={styles.summaryCount}>{applications.filter(app => app.status === 'APPROVED').length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Отклоненные:</span>
                      <span className={styles.summaryCount}>{applications.filter(app => app.status === 'REJECTED').length}</span>
                  </div>
                  <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Всего:</span>
                      <span className={styles.summaryCount}>{applications.length}</span>
                  </div>
              </div>

              <div className={styles.filters}>
                  <button
                    className={filter === 'ALL' ? styles.active : ''}
                    onClick={() => setFilter('ALL')}
                  >
                      Все
                  </button>
                  <button
                    className={filter === 'NEW' ? styles.active : ''}
                    onClick={() => setFilter('NEW')}
                  >
                      Новые
                  </button>
                  <button
                    className={filter === 'IN_PROGRESS' ? styles.active : ''}
                    onClick={() => setFilter('IN_PROGRESS')}
                  >
                      В работе
                  </button>
                  <button
                    className={filter === 'APPROVED' ? styles.active : ''}
                    onClick={() => setFilter('APPROVED')}
                  >
                      Одобренные
                  </button>
                  <button
                    className={filter === 'REJECTED' ? styles.active : ''}
                    onClick={() => setFilter('REJECTED')}
                  >
                      Отклоненные
                  </button>
              </div>

              <div className={styles.applicationsList}>
                  {applications.length === 0 ? (
                    <p>Нет заявок</p>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className={styles.applicationCard}>
                          <div className={styles.cardHeader}>
                              <h3>Заявка #{app.id} - {getTypeText(app.type)}</h3>
                              <span className={`${styles.status} ${styles[app.status.toLowerCase()]}`}>
                                  {getStatusText(app.status)}
                              </span>
                          </div>
                          <div className={styles.cardBody}>
                              {app.client ? (
                                <>
                                    <p><strong>Клиент:</strong> {app.client.fullName}</p>
                                    <p><strong>Телефон:</strong> {app.client.phoneNumber}</p>
                                </>
                              ) : (
                                <p><strong>Клиент:</strong> Не указан</p>
                              )}
                              <p><strong>Счет:</strong> {app.account.accountNumber}</p>
                              <p><strong>Баланс:</strong> {app.account.balance}</p>
                          </div>
                          <div className={styles.cardActions}>
                              <button
                                className={styles.detailsButton}
                                onClick={() => fetchApplicationById(app.id)}
                              >
                                  Подробнее
                              </button>
                              {app.status === 'NEW' && (
                                <>
                                    <button
                                      className={styles.acceptButton}
                                      onClick={() => handleUpdateStatus(app.id, 'IN_PROGRESS')}
                                    >
                                        В работу
                                    </button>
                                    <button
                                      className={styles.rejectButton}
                                      onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                    >
                                        Отклонить
                                    </button>
                                </>
                              )}
                              {app.status === 'IN_PROGRESS' && (
                                <>
                                    <button
                                      className={styles.approveButton}
                                      onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                                    >
                                        Одобрить
                                    </button>
                                    <button
                                      className={styles.rejectButton}
                                      onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                    >
                                        Отклонить
                                    </button>
                                </>
                              )}
                          </div>
                      </div>
                    ))
                  )}
              </div>

              {selectedApplication && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Детали заявки #{selectedApplication.id}</h2>
                        <div className={styles.modalBody}>
                            <div className={styles.modalRow}>
                                <span>Тип:</span>
                                <span>{getTypeText(selectedApplication.type)}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span>Статус:</span>
                                <span>{getStatusText(selectedApplication.status)}</span>
                            </div>
                            {selectedApplication.client && (
                              <>
                                  <div className={styles.modalRow}>
                                      <span>Клиент:</span>
                                      <span>{selectedApplication.client.fullName}</span>
                                  </div>
                                  <div className={styles.modalRow}>
                                      <span>Телефон:</span>
                                      <span>{selectedApplication.client.phoneNumber}</span>
                                  </div>
                                  <div className={styles.modalRow}>
                                      <span>Email:</span>
                                      <span>{selectedApplication.client.email}</span>
                                  </div>
                              </>
                            )}
                            <div className={styles.modalRow}>
                                <span>Счет:</span>
                                <span>{selectedApplication.account.accountNumber}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span>Баланс:</span>
                                <span>{selectedApplication.account.balance}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span>Комментарий:</span>
                                <span>{selectedApplication.comment || 'Нет комментария'}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span>Создана:</span>
                                <span>{new Date(selectedApplication.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span>Обновлена:</span>
                                <span>{new Date(selectedApplication.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                              className={styles.closeButton}
                              onClick={() => setSelectedApplication(null)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      </>
    );
};

export default EmployeeDashboard;