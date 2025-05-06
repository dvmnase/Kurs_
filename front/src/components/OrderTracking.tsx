import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import styles from '../styles/components/OrderTracking.module.sass';

interface Order {
    orderId: number;
    serviceId: number;
    employeeId: number;
    serviceName: string;
    servicePrice: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    employeeName?: string;
    employeePhone?: string;
    description?: string;
}

const OrderTracking = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = authService.getToken();
            const clientId = authService.getClientId();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!clientId) {
                throw new Error('ID клиента не найден');
            }

            console.log('Fetching orders for clientId:', clientId);

            const response = await fetch(`http://localhost:8080/user/orders/history/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Ошибка при загрузке заказов: ${response.status}`);
            }

            const data = await response.json();
            console.log('Orders data:', data);
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const orderId = parseInt(e.target.value, 10);
        const order = orders.find(o => o.orderId === orderId);
        setSelectedOrder(order || null);
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;

        try {
            setCancelling(true);
            setError(null);
            setSuccessMessage(null);
            const token = authService.getToken();
            const clientId = authService.getClientId();

            if (!token) {
                throw new Error('Требуется авторизация');
            }

            if (!clientId) {
                throw new Error('ID клиента не найден');
            }

            console.log('Cancelling order:', selectedOrder.orderId);
            console.log('Using token:', token);
            console.log('Client ID:', clientId);

            const url = `http://localhost:8080/user/orders/${selectedOrder.orderId}/cancel?clientId=${clientId}`;
            console.log('Request URL:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Ошибка при отмене заказа: ${errorText}`);
            }

            const result = await response.text();
            console.log('Success response:', result);

            // Обновляем список заказов после отмены
            await fetchOrders();

            // Показываем сообщение об успехе
            setSuccessMessage('Заказ успешно отменен');

            // Сбрасываем выбранный заказ
            setSelectedOrder(null);
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка при отмене заказа');
        } finally {
            setCancelling(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'NEW':
                return styles.new;
            case 'IN_PROGRESS':
                return styles.inProgress;
            case 'COMPLETED':
                return styles.completed;
            case 'CANCELLED':
                return styles.cancelled;
            default:
                return '';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'NEW':
                return 'Новый';
            case 'IN_PROGRESS':
                return 'В работе';
            case 'COMPLETED':
                return 'Завершен';
            case 'CANCELLED':
                return 'Отменен';
            default:
                return status;
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Отслеживание заказа</h2>

            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.selectContainer}>
                <label htmlFor="orderSelect" className={styles.label}>
                    Выберите заказ:
                </label>
                <select
                    id="orderSelect"
                    className={styles.select}
                    value={selectedOrder?.orderId || ''}
                    onChange={handleOrderSelect}
                >
                    <option value="">Выберите заказ</option>
                    {orders.map(order => (
                        <option key={order.orderId} value={order.orderId}>
                            Заказ #{order.orderId} - {order.serviceName} ({order.servicePrice} ₽)
                        </option>
                    ))}
                </select>
            </div>

            {selectedOrder && (
                <div className={styles.orderDetails}>
                    <h3>Статус заказа #{selectedOrder.orderId}</h3>
                    <div className={styles.detail}>
                        <span className={styles.label}>Услуга:</span>
                        <span className={styles.value}>{selectedOrder.serviceName}</span>
                    </div>
                    <div className={styles.detail}>
                        <span className={styles.label}>Статус:</span>
                        <span className={`${styles.value} ${getStatusColor(selectedOrder.status)}`}>
                            {getStatusText(selectedOrder.status)}
                        </span>
                    </div>
                    {selectedOrder.employeeName && (
                        <div className={styles.detail}>
                            <span className={styles.label}>Исполнитель:</span>
                            <span className={styles.value}>{selectedOrder.employeeName}</span>
                        </div>
                    )}
                    {selectedOrder.employeePhone && (
                        <div className={styles.detail}>
                            <span className={styles.label}>Телефон исполнителя:</span>
                            <span className={styles.value}>{selectedOrder.employeePhone}</span>
                        </div>
                    )}
                    {selectedOrder.description && (
                        <div className={styles.detail}>
                            <span className={styles.label}>Описание:</span>
                            <span className={styles.value}>{selectedOrder.description}</span>
                        </div>
                    )}
                    <div className={styles.detail}>
                        <span className={styles.label}>Дата создания:</span>
                        <span className={styles.value}>
                            {new Date(selectedOrder.createdAt).toLocaleString()}
                        </span>
                    </div>
                    {selectedOrder.status === 'NEW' && (
                        <div className={styles.cancelButtonContainer}>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Отмена...' : 'Отменить заказ'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderTracking; 