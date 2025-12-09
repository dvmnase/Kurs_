'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import SignInForm from '../components/auth/SignInForm';
import SignUpForm from '../components/auth/SignUpForm';
import styles from '../styles/auth/auth.module.sass';

export default function HomePage() {
    const router = useRouter();
    const [showSignUp, setShowSignUp] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Проверяем, авторизован ли пользователь
        if (authService.isAuthenticated()) {
            setIsAuthenticated(true);
            const role = authService.getRole();
            
            // Редиректим в зависимости от роли
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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;
    }

    if (isAuthenticated) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Перенаправление...</div>;
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authHeader}>
                <h1>Система грузоперевозок</h1>
                <p>Управление грузами и заявками на перевозку</p>
            </div>
            
            <div className={styles.authContent}>
                {!showSignUp ? (
                    <>
                        <SignInForm onSuccess={handleSignInSuccess} />
                        <div className={styles.switchForm}>
                            <p>Нет аккаунта? <button onClick={() => setShowSignUp(true)}>Зарегистрироваться</button></p>
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
                            <p>Уже есть аккаунт? <button onClick={() => setShowSignUp(false)}>Войти</button></p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
