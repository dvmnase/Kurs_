import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/EmployeeManagement.module.sass';
import cn from 'classnames';
import { authService } from '../../services/authService';

interface Employee {
    id: number;
    username: string;
    email: string;
    fullName: string;
    qualification: string;
    phoneNumber: string;
    photo?: string;
}

const anonImagePath = '/images/content/anon.png';   

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState < Employee[] > ([]);
    const [loading, setLoading] = useState(true);
    const [editingEmployee, setEditingEmployee] = useState < Employee | null > (null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState < string | null > (null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        qualification: '',
        phoneNumber: '',
    });
    const [selectedPhoto, setSelectedPhoto] = useState < File | null > (null);
    const [previewUrl, setPreviewUrl] = useState < string | null > (null);
    const [formError, setFormError] = useState < string | null > (null);

    const getImageFormat = (base64String: string): string => {
        // Определяем формат по первым символам base64
        if (base64String.startsWith('iVBORw0KGgo')) {
            return 'image/png';
        } else if (base64String.startsWith('/9j/')) {
            return 'image/jpeg';
        } else if (base64String.startsWith('PHN2Zy')) {
            return 'image/svg+xml';
        } else if (base64String.startsWith('R0lGOD')) {
            return 'image/gif';
        }
        return 'image/jpeg'; // По умолчанию
    };

    const getImageSrc = (photo: string): string => {
        const format = getImageFormat(photo);
        return `data:${format};base64,${photo}`;
    };

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


            const response = await fetch('http://localhost:8080/api/admin/employees', {
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
            qualification: '',
            phoneNumber: '',
        });
        setSelectedPhoto(null);
        setPreviewUrl(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            username: employee.username || '',
            email: employee.email || '',
            password: '',
            fullName: employee.fullName || '',
            qualification: employee.qualification || '',
            phoneNumber: employee.phoneNumber || '',
        });
        setSelectedPhoto(null);
        setPreviewUrl(employee.photo ? getImageSrc(employee.photo) : null);
        setIsModalOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedPhoto(e.target.files[0]);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
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
                qualification: formData.qualification,
                phoneNumber: formData.phoneNumber,
            };

            const form = new FormData();
            form.append('employee', new Blob([JSON.stringify(employeeData)], { type: 'application/json' }));
            if (selectedPhoto) {
                form.append('photo', selectedPhoto);
            } else {
                const response = await fetch(anonImagePath);
                const blob = await response.blob();
                form.append('photo', blob, 'anon.png');
            }

            const url = editingEmployee
                ? `http://localhost:8080/api/admin/employees/${editingEmployee.id}`
                : 'http://localhost:8080/api/admin/employees';

            const response = await fetch(url, {
                method: editingEmployee ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            });
            if (!response.ok) {
                const errorText = await response.text();
                // Проверяем на дублирующийся логин или email
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
            // setError('Ошибка при сохранении сотрудника');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            try {
                const token = authService.getToken();
                if (!token) {
                    throw new Error('Токен не найден');
                }

                const response = await fetch(`http://localhost:8080/api/admin/employees/${id}`, {
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
                    <div className={styles.cell}>Фото</div>
                    <div className={styles.cell}>Логин</div>
                    <div className={styles.cell}>Email</div>
                    <div className={styles.cell}>ФИО</div>
                    <div className={styles.cell}>Квалификация</div>
                    <div className={styles.cell}>Телефон</div>
                    <div className={styles.cell}>Действия</div>
                </div>
                {employees.map(employee => (
                    <div key={employee.id} className={styles.row}>
                        <div className={styles.cell}>{employee.id}</div>
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
                        <div className={styles.cell}>{employee.username}</div>
                        <div className={styles.cell}>{employee.email}</div>
                        <div className={styles.cell}>{employee.fullName}</div>
                        <div className={styles.cell}>{employee.qualification}</div>
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
                                <label>Квалификация</label>
                                <input
                                    type="text"
                                    name="qualification"
                                    value={formData.qualification}
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
                            <div className={styles.formGroup}>
                                <label>Фотография</label>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} />
                                {previewUrl && (
                                    <div className={styles.imagePreview}>
                                        <img
                                            src={previewUrl}
                                            alt="Предпросмотр"
                                        />
                                    </div>
                                )}
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