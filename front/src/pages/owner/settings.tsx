import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'
import api from '../../services/api'
import Layout from '../../components/Layout'
import ChatBot from '../../components/ChatBot'
import styles from '../../styles/client/ClientHome.module.sass'

const OwnerSettingsPage = () => {
    const router = useRouter()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setError(null)
            setSuccess(null)

            const response = await api.put('/api/owner/account/username', null, {
                params: { username },
            })

            const newToken = response.data.token
            const newUsername = response.data.username

            if (newToken) {
                localStorage.setItem('token', newToken)

                const currentUser = authService.getUser()

                if (currentUser) {
                    const updatedUser = {
                        ...currentUser,
                        username: newUsername,
                    }

                    localStorage.setItem('user', JSON.stringify(updatedUser))
                }

                api.defaults.headers.common.Authorization = `Bearer ${newToken}`
            }

            setSuccess('Имя пользователя успешно обновлено')
            setUsername('')

            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.location.reload()
                }
            }, 1000)
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при обновлении имени пользователя')
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Пароли не совпадают')
            return
        }

        try {
            setError(null)
            setSuccess(null)

            await api.put('/api/owner/account/password', null, {
                params: { password },
            })

            setSuccess('Пароль успешно обновлен')
            setPassword('')
            setConfirmPassword('')

            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.location.reload()
                }
            }, 1000)
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при обновлении пароля')
        }
    }

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Тендеры', url: '/owner/tenders' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Чаты', url: '/owner/chats' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    }

    return (
        <Layout
            title="Настройки"
            navigationPaths={navigation}
            showLogout
            onLogout={() => {
                authService.logout()
                router.push('/')
            }}
        >
            <div className={styles.container}>
                <div className={styles.settingsHero}>
                    <div>
                        <span className={styles.kicker}>Профиль владельца груза</span>
                        <h1>Настройки аккаунта</h1>
                        <p>
                            Управляйте данными входа, обновляйте имя пользователя и пароль для безопасной работы
                            с грузами, заявками и чатами.
                        </p>
                    </div>

                    <div className={styles.settingsBadge}>
                        <span>HT</span>
                        <strong>Owner</strong>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.settingsGrid}>
                    <div className={styles.settingsSection}>
                        <div className={styles.settingsSectionHead}>
                            <div className={styles.settingsIcon}>👤</div>
                            <div>
                                <h2>Имя пользователя</h2>
                                <p>Измените логин, который используется для входа в аккаунт владельца груза.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateUsername}>
                            <label>
                                Новое имя пользователя
                                <input
                                    type="text"
                                    placeholder="Например: owner_minsk"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </label>

                            <button type="submit">Сохранить имя</button>
                        </form>
                    </div>

                    <div className={styles.settingsSection}>
                        <div className={styles.settingsSectionHead}>
                            <div className={styles.settingsIcon}>🔒︎</div>
                            <div>
                                <h2>Пароль</h2>
                                <p>Обновите пароль, чтобы защитить доступ к грузам, заявкам и перепискам.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword}>
                            <label>
                                Новый пароль
                                <input
                                    type="password"
                                    placeholder="Введите новый пароль"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Подтверждение пароля
                                <input
                                    type="password"
                                    placeholder="Повторите новый пароль"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </label>

                            <button type="submit">Сохранить пароль</button>
                        </form>
                    </div>
                </div>

                <ChatBot />
            </div>
        </Layout>
    )
}

export default OwnerSettingsPage