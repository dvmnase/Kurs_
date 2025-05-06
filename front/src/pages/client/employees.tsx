import React, { useState, useEffect } from 'react';
import ClientLayout from '../../components/client/ClientLayout';
import styles from '../../styles/client/EmployeeList.module.sass';
import { authService } from '../../services/authService';
import { useRouter } from 'next/router';

interface Employee {
    id: number;
    username: string;
    email: string;
    fullName: string;
    qualification: string;
    phoneNumber: string;
    photo?: string;
}

const EmployeesPage = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const getImageFormat = (base64String: string): string => {
        if (base64String.startsWith('iVBORw0KGgo')) {
            return 'image/png';
        } else if (base64String.startsWith('/9j/')) {
            return 'image/jpeg';
        } else if (base64String.startsWith('PHN2Zy')) {
            return 'image/svg+xml';
        } else if (base64String.startsWith('R0lGOD')) {
            return 'image/gif';
        }
        return 'image/jpeg';
    };

    const getImageSrc = (photo: string): string => {
        const format = getImageFormat(photo);
        return `data:${format};base64,${photo}`;
    };

    useEffect(() => {
        const token = authService.getToken();
        if (!token) {
            router.push('/client');
            return;
        }
        fetchEmployees();
    }, [router]);

    const fetchEmployees = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                router.push('/client');
                return;
            }

            const response = await fetch('http://localhost:8080/api/user/employees', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/client');
                    return;
                }
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Полученные данные сотрудников:', data);
            setEmployees(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Ошибка при загрузке сотрудников');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </ClientLayout>
        );
    }

    if (error) {
        return (
            <ClientLayout>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className={styles.container}>
                <h1>Наши специалисты</h1>
                <div className={styles.table}>
                    <div className={styles.header}>
                        <div className={styles.cell}>Аватар</div>
                        <div className={styles.cell}>ФИО</div>
                        <div className={styles.cell}>Квалификация</div>
                        <div className={styles.cell}>Телефон</div>
                        <div className={styles.cell}>Email</div>
                    </div>
                    {employees.map(employee => (
                        <div key={employee.id} className={styles.row}>
                            <div className={styles.cell}>
                                {employee.photo ? (
                                    <img
                                        src={getImageSrc(employee.photo)}
                                        alt={employee.fullName}
                                        className={styles.employeeImage}
                                    />
                                ) : (
                                    <div className={styles.placeholderImage}>
                                        <span>Нет фото</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.cell}>{employee.fullName}</div>
                            <div className={styles.cell}>{employee.qualification}</div>
                            <div className={styles.cell}>{employee.phoneNumber}</div>
                            <div className={styles.cell}>{employee.email}</div>
                        </div>
                    ))}
                </div>
            </div>
        </ClientLayout>
    );
};

export default EmployeesPage;

