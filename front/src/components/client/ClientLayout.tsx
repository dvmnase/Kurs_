import React from 'react';
import Header from '../Header';
import styles from '../../styles/client/ClientLayout.module.sass';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';

interface ClientLayoutProps {
    children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
    const router = useRouter();
    const isAuthenticated = authService.isAuthenticated();
    const userRole = authService.getRole();

    const unauthorizedNavigation = [
        {
            name: 'Отзывы',
            path: '/#reviews',
        },
        {
            name: 'О нас',
            path: '/#about',
        },
    ];

    const authorizedNavigation = [
        {
            name: 'Личный кабинет',
            path: '/client/personal-cabinet',
        },
        {
            name: 'Услуги',
            path: '/client/services',
        },
        {
            name: 'Поиск',
            path: '/client/services',
        },
        {
            name: 'Сотрудники',
            path: '/client/employees',
        },
        {
            name: 'Отзывы',
            path: '/client/reviews',
        },
    ];

    const handleLogout = () => {
        authService.logout();
        router.push('/');
    };

    return (
        <div className={styles.layout}>
            {!userRole ? (
                <Header navigation={unauthorizedNavigation} showLogout={false} onLogout={() => { }} />
            ) : (
                <Header
                    navigation={authorizedNavigation}
                    showLogout={isAuthenticated}
                    onLogout={handleLogout}
                />
            )}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
};

export default ClientLayout; 