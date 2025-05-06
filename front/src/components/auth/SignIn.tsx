import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import styles from '../../styles/auth/SignIn.module.sass';
import cn from 'classnames';

const SignIn: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsBlocked(false);

        try {
            await authService.signIn(formData);
            navigate('/');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при авторизации';
            setError(errorMessage);
            if (errorMessage.includes('заблокирован')) {
                setIsBlocked(true);
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h2>Вход в систему</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Имя пользователя</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {error && (
                        <div className={cn(styles.error, {
                            [styles.blockedError]: isBlocked
                        })}>
                            {error}
                        </div>
                    )}
                    <button type="submit">Войти</button>
                </form>
            </div>
        </div>
    );
};

export default SignIn; 