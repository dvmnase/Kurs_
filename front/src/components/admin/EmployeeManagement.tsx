import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/EmployeeManagement.module.sass';
import cn from 'classnames';
import { authService } from '../../services/authService';

interface Employee {
    id: number;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
}


const EmployeeManagement = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
    });

    const [formError, setFormError] = useState<string | null>(null);


    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    const fetchEmployees = async () => {
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Токен не найден');
            }


            const response = await fetch('http://localhost:8080/secured/admin/employees', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
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

    const handleCreate = () => {

        setEditingEmployee(null);

        setFormData({
            username: '',
            email: '',
            password: '',
            fullName: '',
            phoneNumber: '',
        });
        setIsModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            username: employee.username || '',
            email: employee.email || '',
            password: '',
            fullName: employee.fullName || '',
            phoneNumber: employee.phoneNumber || '',
        });

        setIsModalOpen(true);
    };



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Токен не найден');
            }

            const employeeData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
            };

            // Убрали FormData и отправляем как JSON
            const url = editingEmployee
              ? `http://localhost:8080/secured/admin/employees/${editingEmployee.id}`
              : 'http://localhost:8080/secured/admin/employees';

            const response = await fetch(url, {
                method: editingEmployee ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' // Указываем правильный Content-Type
                },
                body: JSON.stringify(employeeData) // Отправляем как JSON
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (errorText.toLowerCase().includes('username')) {
                    setFormError('Пользователь с таким логином уже существует.');
                } else if (errorText.toLowerCase().includes('email')) {
                    setFormError('Пользователь с такой почтой уже существует.');
                } else {
                    setFormError('Ошибка при сохранении сотрудника.');
                }
                throw new Error(`Ошибка сервера: ${response.status} ${errorText}`);
            }

            fetchEmployees();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Токен не найден');
                }

                const response = await fetch(`http://localhost:8080/secured/admin/employees/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setEmployees(employees.filter(employee => employee.id !== id));
                } else {
                    const errorText = await response.text();
                    throw new Error(`Ошибка сервера: ${response.status} ${errorText}`);
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                setError('Ошибка при удалении сотрудника');
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headermain}>
                <h1 className={styles.title}>Управление сотрудниками</h1>
                <button className={styles.addButton} onClick={handleCreate}>
                    Добавить сотрудника
                </button>
            </div>
            <div className={styles.table}>
                <div className={styles.header}>
                    <div className={styles.cell}>ID</div>
                    <div className={styles.cell}>Логин</div>
                    <div className={styles.cell}>Email</div>
                    <div className={styles.cell}>ФИО</div>
                    <div className={styles.cell}>Телефон</div>
                    <div className={styles.cell}>Действия</div>
                </div>
                {employees.map(employee => (
                    <div key={employee.id} className={styles.row}>
                        <div className={styles.cell}>{employee.id}</div>

                        <div className={styles.cell}>{employee.username}</div>
                        <div className={styles.cell}>{employee.email}</div>
                        <div className={styles.cell}>{employee.fullName}</div>
                        <div className={styles.cell}>{employee.phoneNumber}</div>
                        <div className={styles.cell}>
                            <button
                                className={styles.editButton}
                                onClick={() => handleEdit(employee)}
                            >
                                Редактировать
                            </button>
                            <button
                                className={styles.deleteButton}
                                onClick={() => handleDelete(employee.id)}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h3>
                        <form onSubmit={handleSubmit}>
                            {formError && (
                                <div className={styles.formError}>{formError}</div>
                            )}
                            <div className={styles.formGroup}>
                                <label>Логин</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Пароль</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={!editingEmployee}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>ФИО</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Телефон</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit">Сохранить</button>
                                <button type="button" onClick={() => setIsModalOpen(false)}>Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;