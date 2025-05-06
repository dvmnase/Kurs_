import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import styles from '../styles/components/OrderForm.module.sass';

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
}

interface Employee {
    id: number;
    fullName: string;
    phoneNumber: string;
}

const OrderForm = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchServices();
        fetchEmployees();
    }, []);

    const fetchServices = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/user/services', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch services');
            }

            const data = await response.json();
            setServices(data);
        } catch (err) {
            setError('Ошибка при загрузке услуг');
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Требуется авторизация');
            }

            const response = await fetch('http://localhost:8080/user/orders/employees', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();
            setEmployees(data);
        } catch (err) {
            setError('Ошибка при загрузке исполнителей');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !description) {
            setError('Пожалуйста, заполните все обязательные поля');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            const role = authService.getRole();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (role !== 'ROLE_USER') {
                throw new Error('Доступ запрещен');
            }

            // Получаем ID клиента
            const clientId = authService.getClientId();
            if (!clientId) {
                throw new Error('Не удалось получить ID клиента');
            }

            console.log('Sending request to create order:', {
                url: 'http://localhost:8080/user/orders',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    clientId: clientId,
                    serviceId: selectedService,
                    employeeId: selectedEmployee || null,
                    description: description,
                }
            });

            const response = await fetch('http://localhost:8080/user/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: clientId,
                    serviceId: selectedService,
                    employeeId: selectedEmployee || null,
                    description: description
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Ошибка при создании заказа: ${response.status}`);
            }

            try {
                const responseData = await response.json();
                console.log('Success response:', responseData);
                setSuccess(true);
                setDescription('');
                setSelectedService(null);
                setSelectedEmployee(null);
                setTimeout(() => setSuccess(false), 3000);
            } catch (error) {
                console.error('Error parsing response:', error);
                // Если не удалось распарсить JSON, но статус 200, считаем что заказ создан
                setSuccess(true);
                setDescription('');
                setSelectedService(null);
                setSelectedEmployee(null);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="service">Услуга</label>
                    <select
                        id="service"
                        value={selectedService || ''}
                        onChange={(e) => setSelectedService(Number(e.target.value))}
                        className={styles.select}
                        required
                    >
                        <option value="">Выберите услугу</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} - {service.price} ₽
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="employee">Исполнитель (опционально)</label>
                    <select
                        id="employee"
                        value={selectedEmployee || ''}
                        onChange={(e) => setSelectedEmployee(Number(e.target.value))}
                        className={styles.select}
                    >
                        <option value="">Выберите исполнителя</option>
                        {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                                {employee.fullName} - {employee.phoneNumber}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description">Описание заказа *</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.textarea}
                        placeholder="Опишите, что нужно сделать..."
                        required
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>Заказ успешно создан!</div>}

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Создание заказа...' : 'Создать заказ'}
                </button>
            </form>
        </div>
    );
};

export default OrderForm; 