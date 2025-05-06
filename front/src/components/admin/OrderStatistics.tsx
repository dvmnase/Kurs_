import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/OrderStatistics.module.sass';
import { authService } from '../../services/authService';
import { cn } from '../../utils/cn';

interface AccountStats {
    count_accounts: number;
    count_active_accounts: number;
}

const OrderStatistics: React.FC = () => {
    const [accountStats, setAccountStats] = useState<AccountStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/secured/admin/accounts/static', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при получении статистики');
            }

            const data = await response.json();
            setAccountStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
      <div className={styles.container}>
          <div className={styles.header}>
              <h1 className={styles.title}>Статистика счетов</h1>
          </div>

          <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                  <h3>Всего счетов</h3>
                  <p className={styles.statValue}>{accountStats?.count_accounts || 0}</p>
              </div>

              <div className={styles.statCard}>
                  <h3>Активных счетов</h3>
                  <p className={styles.statValue}>{accountStats?.count_active_accounts || 0}</p>
              </div>
          </div>

          <div className={styles.chartsContainer}>
              <div className={styles.chart}>
                  <h3>Соотношение счетов</h3>
                  <div className={styles.statusChart}>
                      {accountStats && (
                        <>
                            <div className={styles.statusBar}>
                                <div className={styles.statusLabel}>Все счета</div>
                                <div className={styles.barContainer}>
                                    <div
                                      className={styles.bar}
                                      style={{ width: '100%' }}
                                    >
                                        {accountStats.count_accounts}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.statusBar}>
                                <div className={styles.statusLabel}>Активные счета</div>
                                <div className={styles.barContainer}>
                                    <div
                                      className={styles.bar}
                                      style={{
                                          width: `${(accountStats.count_active_accounts / accountStats.count_accounts) * 100}%`,
                                          backgroundColor: '#4CAF50'
                                      }}
                                    >
                                        {accountStats.count_active_accounts}
                                    </div>
                                </div>
                            </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
      </div>
    );
};

export default OrderStatistics;