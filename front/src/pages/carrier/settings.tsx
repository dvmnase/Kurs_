import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'
import api from '../../services/api'
import Layout from '../../components/Layout'
import styles from '../../styles/client/ClientHome.module.sass'

const CarrierSettingsPage = () => {
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

            const response = await api.put('/api/carrier/account/username', null, {
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

            await api.put('/api/carrier/account/password', null, {
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
            { title: 'Тендеры', url: '/carrier/tenders' },
            { title: 'Заявки', url: '/carrier/requests' },
            { title: 'Транспорт', url: '/carrier/transports' },
            { title: 'Настройки', url: '/carrier/settings' },
        ],
    }

    return (
        <Layout
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
                        <span className={styles.kicker}>Профиль перевозчика</span>
                        <h1>Настройки аккаунта</h1>
                        <p>
                            Управляйте данными входа, обновляйте имя пользователя и пароль для безопасной работы
                            с заявками и транспортом.
                        </p>
                    </div>

                    <div className={styles.settingsBadge}>
                        <span>HT</span>
                        <strong>Carrier</strong>
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
                                <p>Обновите логин, который используется для входа в аккаунт.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateUsername}>
                            <label>
                                Новое имя пользователя
                                <input
                                    type="text"
                                    placeholder="Например: carrier_minsk"
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
                                <p>Используйте надежный пароль, чтобы защитить доступ к аккаунту.</p>
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
            </div>
        </Layout>
    )
}

export default CarrierSettingsPage