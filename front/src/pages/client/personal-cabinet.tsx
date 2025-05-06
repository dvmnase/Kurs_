import React, { useState, useEffect } from 'react';
import ClientLayout from '../../components/client/ClientLayout';
import { authService } from '../../services/authService';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Modal from '../../components/Modal';
import OrderHistory from '../../components/OrderHistory';
import OrderForm from '../../components/OrderForm';
import OrderTracking from '../../components/OrderTracking';
import ReviewForm from '../../components/ReviewForm';
import styles from '../../styles/client/PersonalCabinet.module.sass';

const PersonalCabinet: React.FC = () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string | null>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const user = authService.getUser();
        if (user) {
            setUserFullName(user.fullName);
            setClientData(user);
        }
    }, []);

    const actions = [
        {
            id: 'order-history',
            title: 'История заказов',
            description: 'Просмотр всех ваших заказов',
            icon: 'history'
        },
        {
            id: 'new-order',
            title: 'Оформить заказ',
            description: 'Создание нового заказа',
            icon: 'plus'
        },
        {
            id: 'track-order',
            title: 'Отследить заказ',
            description: 'Проверка статуса заказа',
            icon: 'track'
        },
        {
            id: 'leave-review',
            title: 'Оставить отзыв',
            description: 'Поделиться впечатлениями',
            icon: 'review'
        }
    ];

    const renderModalContent = () => {
        switch (activeModal) {
            case 'order-history':
                return <OrderHistory />;
            case 'new-order':
                return <OrderForm />;
            case 'track-order':
                return <OrderTracking />;
            case 'leave-review':
                return <ReviewForm />;
            default:
                return null;
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <ProtectedRoute>
            <ClientLayout>
                <div className={styles.container}>
                    <h1 className={styles.title}>Личный кабинет</h1>
                    <div className={styles.welcome}>
                        <p>Добро пожаловать, {userFullName || 'Пользователь'}!</p>
                    </div>

                    <div className={styles.actions}>
                        {actions.map(action => (
                            <button
                                key={action.id}
                                className={styles.actionButton}
                                onClick={() => setActiveModal(action.id)}
                            >
                                <div className={styles.icon}>{action.icon}</div>
                                <div className={styles.content}>
                                    <h3>{action.title}</h3>
                                    <p>{action.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <Modal
                        visible={!!activeModal}
                        onClose={() => setActiveModal(null)}
                        outerClassName={styles.modal}
                        containerClassName={styles.modalContent}
                        disable={false}
                    >
                        <h2>{actions.find(a => a.id === activeModal)?.title}</h2>
                        {renderModalContent()}
                    </Modal>
                </div>
            </ClientLayout>
        </ProtectedRoute>
    );
};

export default PersonalCabinet; 