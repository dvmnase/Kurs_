import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../../styles/client/OrderList.module.sass';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await axios.get('/api/orders', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setOrders(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch orders');
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    const handleCancelOrder = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setOrders(orders.filter(order => order.id !== orderId));
        } catch (err) {
            setError('Failed to cancel order');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.orderList}>
            {orders.length === 0 ? (
                <div className={styles.empty}>No orders found</div>
            ) : (
                orders.map(order => (
                    <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                            <h3>Order #{order.id}</h3>
                            <span className={`${styles.status} ${styles[order.status]}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className={styles.orderDetails}>
                            <p><strong>Service:</strong> {order.service}</p>
                            <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                            <p><strong>Price:</strong> ${order.price}</p>
                        </div>
                        {order.status === 'new' && (
                            <button
                                className={styles.cancelButton}
                                onClick={() => handleCancelOrder(order.id)}
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default OrderList; 