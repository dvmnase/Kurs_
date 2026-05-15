import React, { useState } from 'react';
import { authService, SignInData } from '../../services/authService';
import { useRouter } from 'next/router';
import cn from 'classnames';
import styles from './auth.module.sass';

interface SignInFormProps {
  className?: string;
  onSuccess?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ className, onSuccess }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<SignInData>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authService.signIn(formData);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);

        if (response.data) {
          const userData = {
            ...response.data,
            role: response.role
          };
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Saved user data:', userData);
        }

        onSuccess?.();

        // Проверяем роль и перенаправляем
        if (response.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (response.role === 'OWNER') {
          router.push('/owner/cargo');
        } else if (response.role === 'CARRIER') {
          router.push('/carrier/requests');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError('Не удалось войти. Проверьте логин и пароль.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(className, styles.transfer)}>
      <div className={cn('h4', styles.title)}>Вход</div>
      <div className={styles.text}>
        Введите данные учетной записи, чтобы продолжить работу.
      </div>
      {error && <div className={styles.error}>{error}</div>}
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
            type="password"
            name="password"
            placeholder="Пароль"
            onChange={handleChange}
            value={formData.password}
            required
          />
        </div>
        <div className={styles.btns}>
          <button type="submit" className={cn('button', styles.button)} disabled={isSubmitting}>
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm; 
