import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import AdminLayout from '../../components/admin/AdminLayout';
import UserManagement from '../../components/admin/UserManagement';
import ServiceManagement from '../../components/admin/ServiceManagement';
import EmployeeManagement from '../../components/admin/EmployeeManagement';
import OrderStatistics from '../../components/admin/OrderStatistics';
import AccountManagement from '../../components/admin/AccountManagement';
import styles from '../../styles/admin/Dashboard.module.sass';
import cn from 'classnames';

const AdminDashboard = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState('users');

    const renderContent = () => {
        switch (activeTab) {
            case 'accounts':
                return <AccountManagement />;
            case 'services':
                return <ServiceManagement />;
            case 'employees':
                return <EmployeeManagement />;
            case 'statistics':
                return <OrderStatistics />;
            default:
                return null;
        }
    };

    return (
        <AdminLayout>
            <div className={styles.dashboard}>
                <div className={styles.sidebar}>
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'accounts' })}
                        onClick={() => setActiveTab('accounts')}
                    >
                        Управление клиентами
                    </button>
                   
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'services' })}
                        onClick={() => setActiveTab('services')}
                    >
                        Управление счетами
                    </button>
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'employees' })}
                        onClick={() => setActiveTab('employees')}
                    >
                        Управление сотрудниками
                    </button>
                    <button
                        className={cn(styles.tab, { [styles.active]: activeTab === 'statistics' })}
                        onClick={() => setActiveTab('statistics')}
                    >
                        Статистика по счетам
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