import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import styles from '../../styles/admin/Dashboard.module.sass';
import cn from 'classnames';

// Simple chart component using CSS
const SimpleChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className={styles.chart}>
            {data.map((item, idx) => (
                <div key={idx} className={styles.chartBar}>
                    <div className={styles.chartLabel}>{item.label}</div>
                    <div className={styles.chartBarContainer}>
                        <div 
                            className={styles.chartBarFill}
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        >
                            {item.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Pie chart component
const PieChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Нет данных для отображения
            </div>
        );
    }
    
    let currentAngle = 0;
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];
    
    return (
        <div className={styles.pieChart}>
            <svg width="300" height="300" viewBox="0 0 300 300">
                {data.map((item, idx) => {
                    const percentage = (item.value / total) * 100;
                    const angle = (item.value / total) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;
                    
                    const x1 = 150 + 100 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 150 + 100 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 150 + 100 * Math.cos((currentAngle - 90) * Math.PI / 180);
                    const y2 = 150 + 100 * Math.sin((currentAngle - 90) * Math.PI / 180);
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    return (
                        <path
                            key={idx}
                            d={`M 150 150 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={colors[idx % colors.length]}
                            stroke="white"
                            strokeWidth="2"
                        />
                    );
                })}
            </svg>
            <div className={styles.pieLegend}>
                {data.map((item, idx) => {
                    const percentage = (item.value / total) * 100;
                    return (
                        <div key={idx} className={styles.legendItem}>
                            <div 
                                className={styles.legendColor}
                                style={{ background: colors[idx % colors.length] }}
                            />
                            <span>{item.label}: {item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface Analytics {
    id: number;
    metric: string;
    value: number;
    calculatedAt: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
}

const AdminDashboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState<Analytics[]>([]);
    const [report, setReport] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        role: 'OWNER',
        password: ''
    });

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
            router.push('/');
            return;
        }
        if (activeTab === 'analytics') {
            fetchAnalytics();
        } else if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const [analyticsResponse, reportResponse] = await Promise.all([
                api.get('/api/admin/analytics'),
                api.get('/api/admin/analytics/report')
            ]);
            setAnalytics(analyticsResponse.data);
            setReport(reportResponse.data);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке аналитики');
            } else {
                setError('Ошибка при загрузке аналитики');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/admin/users');
            setUsers(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке пользователей');
            } else {
                setError('Ошибка при загрузке пользователей');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportStatistics = async () => {
        try {
            const response = await api.get('/api/admin/analytics/export', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'statistics.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            setError('Ошибка при экспорте');
        }
    };

    const calculateAnalytics = async () => {
        try {
            setError(null);
            await api.post('/api/admin/analytics/calculate');
            fetchAnalytics();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при расчете аналитики');
            } else {
                setError('Ошибка при расчете аналитики');
            }
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserFormData({
            username: user.username,
            email: user.email,
            role: user.role,
            password: ''
        });
        setShowUserModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            setError(null);
            await api.put(`/api/admin/users/${editingUser.id}`, {
                username: userFormData.username,
                email: userFormData.email,
                role: userFormData.role,
                password: userFormData.password || undefined
            });
            setShowUserModal(false);
            setEditingUser(null);
            setUserFormData({ username: '', email: '', role: 'OWNER', password: '' });
            fetchUsers();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при обновлении пользователя');
            } else {
                setError('Ошибка при обновлении пользователя');
            }
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        try {
            setError(null);
            await api.delete(`/api/admin/users/${id}`);
            fetchUsers();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при удалении пользователя');
            } else {
                setError('Ошибка при удалении пользователя');
            }
        }
    };

    const getStatusLabel = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'NEW': 'Новая',
            'PENDING': 'Ожидает',
            'ACCEPTED': 'Принята',
            'DECLINED': 'Отклонена',
            'CANCELLED': 'Отменена',
            'IN_PROGRESS': 'В процессе'
        };
        return statusMap[status] || status;
    };

    const getMetricLabel = (metric: string): string => {
        const metricMap: { [key: string]: string } = {
            'total_requests': 'Всего заявок',
            'total_cargos': 'Всего грузов',
            'requests_new': 'Заявки: Новая',
            'requests_pending': 'Заявки: Ожидает',
            'requests_accepted': 'Заявки: Принята',
            'requests_declined': 'Заявки: Отклонена',
            'requests_cancelled': 'Заявки: Отменена',
            'requests_in_progress': 'Заявки: В процессе'
        };
        return metricMap[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getInsights = () => {
        if (!report) return [];
        
        const insights = [];
        const requestsByStatus = report.requestsByStatus || {};
        const totalRequests = report.totalRequests || 0;
        const totalCargos = report.totalCargos || 0;
        
        if (totalRequests > 0) {
            const acceptedRate = ((requestsByStatus.ACCEPTED || 0) / totalRequests * 100).toFixed(1);
            insights.push({
                type: 'success',
                title: 'Процент принятых заявок',
                value: `${acceptedRate}%`,
                description: `Из ${totalRequests} заявок принято ${requestsByStatus.ACCEPTED || 0}`
            });
        }
        
        if (totalCargos > 0 && totalRequests > 0) {
            const cargoToRequestRatio = (totalCargos / totalRequests).toFixed(2);
            insights.push({
                type: 'info',
                title: 'Соотношение грузов к заявкам',
                value: cargoToRequestRatio,
                description: `На каждую заявку приходится ${cargoToRequestRatio} грузов`
            });
        }
        
        if (requestsByStatus.NEW > 0) {
            insights.push({
                type: 'warning',
                title: 'Новых заявок',
                value: requestsByStatus.NEW,
                description: 'Требуют внимания перевозчиков'
            });
        }
        
        return insights;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return (
                    <div>
                        <h2>Аналитика заявок и грузов</h2>
                        {error && <div className={styles.error}>{error}</div>}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={calculateAnalytics}
                                style={{ 
                                    padding: '10px 20px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Пересчитать аналитику
                            </button>
                            <button 
                                onClick={handleExportStatistics}
                                style={{ 
                                    padding: '10px 20px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Экспортировать статистику в Excel
                            </button>
                        </div>
                        {loading ? (
                            <div>Загрузка...</div>
                        ) : (
                            <div>
                                {report && (
                                    <>
                                        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                            <h3>Сводный отчет</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                                <div style={{ padding: '15px', background: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                                                        {report.totalRequests}
                                                    </div>
                                                    <div style={{ color: '#666' }}>Всего заявок</div>
                                                </div>
                                                <div style={{ padding: '15px', background: 'white', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                                                        {report.totalCargos}
                                                    </div>
                                                    <div style={{ color: '#666' }}>Всего грузов</div>
                                                </div>
                                            </div>
                                            
                                            {report.requestsByStatus && (
                                                <div style={{ marginTop: '30px' }}>
                                                    <h4>Заявки по статусам</h4>
                                                    <div style={{ display: 'flex', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
                                                        <div style={{ flex: '1', minWidth: '300px' }}>
                                                            <SimpleChart 
                                                                data={Object.entries(report.requestsByStatus).map(([label, value]: [string, any]) => ({
                                                                    label: getStatusLabel(label),
                                                                    value
                                                                }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <PieChart 
                                                                data={Object.entries(report.requestsByStatus).map(([label, value]: [string, any]) => ({
                                                                    label: getStatusLabel(label),
                                                                    value
                                                                }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                            <h3>Выводы и рекомендации</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                                                {getInsights().map((insight, idx) => (
                                                    <div 
                                                        key={idx}
                                                        style={{ 
                                                            padding: '15px', 
                                                            background: 'white', 
                                                            borderRadius: '5px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            borderLeft: `4px solid ${
                                                                insight.type === 'success' ? '#28a745' :
                                                                insight.type === 'warning' ? '#ffc107' :
                                                                '#17a2b8'
                                                            }`
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                                            {insight.title}
                                                        </div>
                                                        <div style={{ fontSize: '24px', color: '#007bff', marginBottom: '5px' }}>
                                                            {insight.value}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                            {insight.description}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3>Детальная аналитика</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
                                        {analytics.map((item) => (
                                            <div 
                                                key={item.id} 
                                                style={{ 
                                                    padding: '15px', 
                                                    background: 'white', 
                                                    borderRadius: '5px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                                    {getMetricLabel(item.metric)}
                                                </div>
                                                <div style={{ fontSize: '20px', color: '#007bff' }}>
                                                    {item.value?.toString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'users':
                return (
                    <div>
                        <h2>Управление пользователями</h2>
                        {error && <div className={styles.error}>{error}</div>}
                        {loading ? (
                            <div>Загрузка...</div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '5px', overflow: 'hidden' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Имя пользователя</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Роль</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Дата регистрации</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '12px' }}>{user.id}</td>
                                                    <td style={{ padding: '12px' }}>{user.username}</td>
                                                    <td style={{ padding: '12px' }}>{user.email}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{ 
                                                            padding: '4px 8px', 
                                                            borderRadius: '3px',
                                                            background: user.role === 'ADMIN' ? '#dc3545' : user.role === 'OWNER' ? '#007bff' : '#28a745',
                                                            color: 'white',
                                                            fontSize: '12px'
                                                        }}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <button 
                                                            onClick={() => handleEditUser(user)}
                                                            style={{ 
                                                                padding: '5px 10px',
                                                                marginRight: '5px',
                                                                background: '#007bff',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Редактировать
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            style={{ 
                                                                padding: '5px 10px',
                                                                background: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Удалить
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {showUserModal && editingUser && (
                                    <div className={styles.modal}>
                                        <form onSubmit={handleUpdateUser}>
                                            <h2>Редактировать пользователя</h2>
                                            <input
                                                type="text"
                                                placeholder="Имя пользователя"
                                                value={userFormData.username}
                                                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={userFormData.email}
                                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                                required
                                            />
                                            <select
                                                value={userFormData.role}
                                                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                                required
                                            >
                                                <option value="ADMIN">Администратор</option>
                                                <option value="OWNER">Грузовладелец</option>
                                                <option value="CARRIER">Перевозчик</option>
                                            </select>
                                            <input
                                                type="password"
                                                placeholder="Новый пароль (оставьте пустым, чтобы не менять)"
                                                value={userFormData.password}
                                                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                            />
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button type="submit">Сохранить</button>
                                                <button type="button" onClick={() => {
                                                    setShowUserModal(false);
                                                    setEditingUser(null);
                                                }}>Отмена</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AdminLayout>
            <div className={styles.dashboard}>
                <div className={styles.sidebar}>
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'analytics' })}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Аналитика заявок и грузов
                    </button>
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'users' })}
                        onClick={() => setActiveTab('users')}
                    >
                        Управление пользователями
                    </button>
                </div>
                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
