import React, { useState } from 'react';
import { authService, SignUpData } from '../../services/authService';
import { useRouter } from 'next/router';
import cn from 'classnames';
import styles from './auth.module.sass';

interface SignUpFormProps {
  className?: string;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ className, onSuccess, onSwitchToLogin }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpData>({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    fullName: '',
    phoneNumber: '',
    address: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.signUp(formData);
      setSuccess('Регистрация успешно завершена! Теперь вы можете войти в систему.');
      setIsRegistered(true);
    } catch (err: any) {
      setError(err.response?.data || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    onSwitchToLogin();
  };

  return (
    <div className={cn(className, styles.transfer)}>
      <div className={cn('h4', styles.title)}>Регистрация</div>
      <div className={styles.text}>
        {!isRegistered ? 'Введите свои данные для регистрации' : ''}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      
      {!isRegistered ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="text"
              name="username"
              placeholder="Имя пользователя"
              onChange={handleChange}
              value={formData.username}
              required
            />
          </div>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              name="password"
              placeholder="Пароль"
              onChange={handleChange}
              value={formData.password}
              required
            />
          </div>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="text"
              name="fullName"
              placeholder="ФИО"
              onChange={handleChange}
              value={formData.fullName}
              required
            />
          </div>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="tel"
              name="phoneNumber"
              placeholder="Номер телефона"
              onChange={handleChange}
              value={formData.phoneNumber}
              required
            />
          </div>
          <div className={styles.field}>
            <input
              className={styles.input}
              type="text"
              name="address"
              placeholder="Адрес"
              onChange={handleChange}
              value={formData.address}
              required
            />
          </div>
          <div className={styles.btns}>
            <button 
              type="submit" 
              className={cn('button', styles.button)}
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.btns}>
          <button 
            onClick={handleGoToLogin}
            className={cn('button', styles.button, styles.loginButton)}
          >
            Перейти к входу
          </button>
        </div>
      )}
    </div>
  );
};

export default SignUpForm; 