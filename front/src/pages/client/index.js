'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import Layout from '../../components/Layout';
import YouTubeVideo from '../../components/YouTubeVideo';
import styles from '../../styles/client/ClientHome.module.sass';

export default function ClientPage() {
    const router = useRouter();
    const userRole = authService.getRole();

    const navigation = {
        menu: [
            {
                title: 'Личный кабинет',
                url: '/client/personal-cabinet',
            },
            {
                title: 'Услуги',
                url: '/client/services',
            },
            {
                title: 'Поиск',
                url: '/client/services',
            },
            {
                title: 'Сотрудники',
                url: '/client/employees',
            },
            {
                title: 'Отзывы',
                url: '/client/reviews',
            },
        ],
    };

    const handleLogout = () => {
        authService.logout();
        router.push('/');
    };

    return (
        <Layout navigationPaths={navigation} showLogout={true} onLogout={handleLogout}>
            <div className={styles.container}>
                <div className={styles.hero}>
                    <h1>Добро пожаловать в RemontPro</h1>
                    <p>Ваш надежный партнер в ремонте и обслуживании</p>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature} onClick={() => router.push('/client/services')}>
                        <h3>Наши услуги</h3>
                        <p>Просмотр доступных услуг и их описание</p>
                    </div>
                    <div className={styles.feature} onClick={() => router.push('/client/employees')}>
                        <h3>Наши специалисты</h3>
                        <p>Информация о команде профессионалов</p>
                    </div>
                    <div className={styles.feature} onClick={() => router.push('/client/services')}>
                        <h3>Поиск услуг</h3>
                        <p>Быстрый поиск нужных вам услуг</p>
                    </div>
                    <div className={styles.feature} onClick={() => router.push('/#reviews')}>
                        <h3>Отзывы клиентов</h3>
                        <p>Мнения наших довольных клиентов</p>
                    </div>
                </div>

                <div className={styles.videoSection}>
                    <h2>Наши работы</h2>
                    <YouTubeVideo />
                </div>
            </div>
        </Layout>
    );
} 