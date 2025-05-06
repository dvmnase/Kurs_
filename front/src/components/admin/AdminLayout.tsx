import React from 'react';
import styles from '../../styles/admin/AdminLayout.module.sass';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();

    const handleLogout = () => {
        authService.logout();
        router.push('/');
    };

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logo} onClick={() => router.push('/admin/dashboard')}>
                        RemontPro Admin
                    </div>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </header>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout; 