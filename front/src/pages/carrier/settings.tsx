import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import styles from '../../styles/client/ClientHome.module.sass';

const CarrierSettingsPage = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            const response = await api.put('/api/carrier/account/username', null, {
                params: { username }
            });
            
            // Получаем новый токен из ответа
            const newToken = response.data.token;
            const newUsername = response.data.username;
            
            if (newToken) {
                // Обновляем токен в localStorage
                localStorage.setItem('token', newToken);
                
                // Обновляем данные пользователя
                const currentUser = authService.getUser();
                if (currentUser) {
                    const updatedUser = {
                        ...currentUser,
                        username: newUsername
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                
                // Обновляем заголовок авторизации для всех последующих запросов
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            }
            
            setSuccess('Имя пользователя обновлено');
            setUsername('');
            
            // Обновляем страницу через небольшую задержку, чтобы данные успели сохраниться
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при обновлении имени пользователя');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        try {
            setError(null);
            await api.put('/api/carrier/account/password', null, {
                params: { password }
            });
            
            // Пароль обновлен в БД, но токен остается валидным
            // Данные пользователя не нужно обновлять, так как пароль не хранится в localStorage
            setSuccess('Пароль обновлен');
            setPassword('');
            setConfirmPassword('');
            
            // Обновляем страницу через небольшую задержку, чтобы данные успели сохраниться
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.location.reload();
                }
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при обновлении пароля');
        }
    };

    const navigation = {
        menu: [
            { title: 'Заявки', url: '/carrier/requests' },
            { title: 'Транспорт', url: '/carrier/transports' },
            { title: 'Настройки', url: '/carrier/settings' },
        ],
    };

    return (
        <Layout navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Настройки аккаунта</h1>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.settingsSection}>
                    <h2>Изменить имя пользователя</h2>
                    <form onSubmit={handleUpdateUsername}>
                        <input
                            type="text"
                            placeholder="Новое имя пользователя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <button type="submit">Обновить</button>
                    </form>
                </div>

                <div className={styles.settingsSection}>
                    <h2>Изменить пароль</h2>
                    <form onSubmit={handleUpdatePassword}>
                        <input
                            type="password"
                            placeholder="Новый пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Подтвердите пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Обновить</button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default CarrierSettingsPage;




