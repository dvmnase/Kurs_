'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import SignInForm from '../components/auth/SignInForm';
import SignUpForm from '../components/auth/SignUpForm';
import styles from '../styles/auth/auth.module.sass';

const platformStats = [
    { value: '24/7', label: 'контроль заявок' },
    { value: '3', label: 'роли в системе' },
    { value: 'Excel', label: 'отчеты и экспорт' },
];

export default function HomePage() {
    const router = useRouter();
    const [showSignUp, setShowSignUp] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authService.isAuthenticated()) {
            setIsAuthenticated(true);
            const role = authService.getRole();

            if (role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else if (role === 'OWNER') {
                router.push('/owner/cargo');
            } else if (role === 'CARRIER') {
                router.push('/carrier/requests');
            }
        }
        setIsLoading(false);
    }, [router]);

    const handleSignInSuccess = () => {
        const role = authService.getRole();
        if (role === 'ADMIN') {
            router.push('/admin/dashboard');
        } else if (role === 'OWNER') {
            router.push('/owner/cargo');
        } else if (role === 'CARRIER') {
            router.push('/carrier/requests');
        }
    };

    if (isLoading) {
        return (
            <div className={styles.stateScreen}>
                <div className={styles.loaderDot} />
                <span>Загрузка интерфейса</span>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className={styles.stateScreen}>
                <div className={styles.loaderDot} />
                <span>Перенаправляем в личный кабинет</span>
            </div>
        );
    }

    return (
        <main className={styles.authContainer}>
            <section className={styles.authShell}>
                <aside className={styles.visualPanel}>
                    <div className={styles.brandMark}>
                        <span>HT</span>
                        <strong>HeatTruck</strong>
                    </div>
                    <div className={styles.heroCopy}>
                        <span className={styles.eyebrow}>Логистика без хаоса</span>
                        <h1>Управляйте грузами, заявками и перевозчиками в одном окне</h1>
                        <p>
                            Рабочая панель для владельцев грузов, перевозчиков и администратора:
                            от создания груза до аналитики и маршрутов.
                        </p>
                    </div>
                    <div className={styles.statsGrid}>
                        {platformStats.map((item) => (
                            <div className={styles.statCard} key={item.label}>
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className={styles.authContent}>
                    <div className={styles.authHeader}>
                        <span className={styles.cardEyebrow}>Личный кабинет</span>
                        <h2>{showSignUp ? 'Создать аккаунт' : 'Войти в систему'}</h2>
                        <p>
                            {showSignUp
                                ? 'Заполните данные, чтобы начать работать с перевозками.'
                                : 'Используйте логин и пароль для доступа к своей роли.'}
                        </p>
                    </div>

                    {!showSignUp ? (
                        <>
                            <SignInForm onSuccess={handleSignInSuccess} />
                            <div className={styles.switchForm}>
                                <p>
                                    Нет аккаунта?
                                    <button onClick={() => setShowSignUp(true)}>Зарегистрироваться</button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <SignUpForm
                                onSuccess={() => {
                                    setShowSignUp(false);
                                }}
                                onSwitchToLogin={() => setShowSignUp(false)}
                            />
                            <div className={styles.switchForm}>
                                <p>
                                    Уже есть аккаунт?
                                    <button onClick={() => setShowSignUp(false)}>Войти</button>
                                </p>
                            </div>
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}
