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
    role: 'OWNER',
    fullName: '',
    phoneNumber: '',
    companyName: ''
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      setSuccess('Аккаунт создан. Теперь можно войти в систему.');
      setIsRegistered(true);
    } catch (err: any) {
      setError(err.response?.data || 'Не удалось зарегистрироваться. Проверьте данные и попробуйте еще раз.');
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
        {!isRegistered ? 'Создайте профиль и выберите роль для работы в системе.' : ''}
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
            <select
              className={styles.input}
              name="role"
              onChange={handleChange}
              value={formData.role}
              required
            >
              <option value="OWNER">Грузовладелец</option>
              <option value="CARRIER">Перевозчик</option>
            </select>
          </div>
          {formData.role === 'CARRIER' && (
            <div className={styles.field}>
              <input
                className={styles.input}
                type="text"
                name="companyName"
                placeholder="Название компании"
                onChange={handleChange}
                value={formData.companyName}
                required
              />
            </div>
          )}
          <div className={styles.btns}>
            <button 
              type="submit" 
              className={cn('button', styles.button)}
              disabled={isLoading}
            >
              {isLoading ? 'Создаем аккаунт...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.btns}>
          <button 
            onClick={handleGoToLogin}
            className={cn('button', styles.button, styles.loginButton)}
          >
            Перейти ко входу
          </button>
        </div>
      )}
    </div>
  );
};

export default SignUpForm; 
