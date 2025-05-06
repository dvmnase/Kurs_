import React from 'react';
import { Link } from 'react-router-dom';
import styles from './admin.module.sass';

const AdminPanel: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Панель администратора банка</h1>

            <div className={styles.navigation}>
                <Link to="/admin/accounts" className={styles.navButton}>
                    Управление счетами
                </Link>
                <Link to="/admin/users" className={styles.navButton}>
                    Управление клиентами
                </Link>
                <Link to="/admin/employees" className={styles.navButton}>
                    Управление сотрудниками
                </Link>
                <Link to="/admin/applications" className={styles.navButton}>
                    Управление заявками
                </Link>
            </div>
        </div>
    );
};

export default AdminPanel; 