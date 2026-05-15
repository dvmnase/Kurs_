import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'
import api from '../../services/api'
import Layout from '../../components/Layout'
import RequestChat from '../../components/RequestChat'
import styles from '../../styles/client/ClientHome.module.sass'
import { getStatusKey, getStatusLabel } from '../../utils/statusLabels'

interface Request {
    id: number
    cargoId: number
    status: string
    pickupDate: string
    deliveryDate: string
    comment: string
    cargo: {
        name: string
    }
    ownerName: string
    hasRoute?: boolean
}

const CarrierRequestsPage = () => {
    const router = useRouter()

    const [myRequests, setMyRequests] = useState<Request[]>([])
    const [availableRequests, setAvailableRequests] = useState<Request[]>([])
    const [activeTab, setActiveTab] = useState<'my' | 'available'>('available')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showChat, setShowChat] = useState(false)
    const [chatRequestId, setChatRequestId] = useState<number | null>(null)
    const [currentUserId, setCurrentUserId] = useState<number>(0)

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isCarrier()) {
            router.push('/')
            return
        }

        fetchCurrentUserId()
        fetchRequests()
    }, [])

    const getErrorMessage = (err: any, fallback: string) => {
        const errorMessage = err.response?.data

        if (typeof errorMessage === 'string') {
            return errorMessage
        }

        if (errorMessage && typeof errorMessage === 'object') {
            return errorMessage.message || errorMessage.error || fallback
        }

        return fallback
    }

    const fetchCurrentUserId = async () => {
        try {
            const response = await api.get('/api/user/me')

            if (response.data?.id) {
                setCurrentUserId(response.data.id)
            }
        } catch (err) {
            console.error('Error fetching current user ID:', err)

            const user = authService.getUser()

            if (user?.id) {
                setCurrentUserId(user.id)
            }
        }
    }

    const fetchRequests = async () => {
        try {
            setLoading(true)
            setError(null)

            const [myResponse, availableResponse] = await Promise.all([
                api.get('/api/carrier/requests'),
                api.get('/api/carrier/requests/available'),
            ])

            setMyRequests(myResponse.data)
            setAvailableRequests(availableResponse.data)
        } catch (err: any) {
            setError(getErrorMessage(err, 'Ошибка при загрузке заявок'))
        } finally {
            setLoading(false)
        }
    }

    const handleAcceptRequest = async (id: number) => {
        try {
            setError(null)
            await api.post(`/api/carrier/requests/${id}/accept`)
            fetchRequests()
        } catch (err: any) {
            setError(getErrorMessage(err, 'Ошибка при принятии заявки'))
        }
    }

    const handleDeclineRequest = async (id: number) => {
        try {
            setError(null)
            await api.post(`/api/carrier/requests/${id}/decline`)
            fetchRequests()
        } catch (err: any) {
            setError(getErrorMessage(err, 'Ошибка при отклонении заявки'))
        }
    }

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            setError(null)

            await api.put(`/api/carrier/requests/${id}/status`, {
                status: newStatus,
            })

            fetchRequests()
        } catch (err: any) {
            setError(getErrorMessage(err, 'Ошибка при изменении статуса'))
        }
    }

    const openChat = (requestId: number) => {
        setChatRequestId(requestId)
        setShowChat(true)
    }

    const activeRequests = activeTab === 'available' ? availableRequests : myRequests

    const navigation = {
        menu: [
            { title: 'Тендеры', url: '/carrier/tenders' },
            { title: 'Заявки', url: '/carrier/requests' },
            { title: 'Чаты', url: '/carrier/chats' },
            { title: 'Транспорт', url: '/carrier/transports' },
            { title: 'Настройки', url: '/carrier/settings' },
        ],
    }

    return (
        <Layout
            navigationPaths={navigation}
            showLogout
            onLogout={() => {
                authService.logout()
                router.push('/')
            }}
        >
            <div className={styles.container}>
                <div className={styles.requestsHero}>
                    <div>
                        <span className={styles.kicker}>Рабочий кабинет перевозчика</span>
                        <h1>Заявки на перевозку</h1>
                        <p>
                            Принимайте доступные заявки, отслеживайте текущие перевозки и общайтесь с владельцами
                            грузов в чате.
                        </p>
                    </div>

                    <div className={styles.tendersStats}>
                        <div>
                            <strong>{availableRequests.length}</strong>
                            <span>доступно</span>
                        </div>
                        <div>
                            <strong>{myRequests.length}</strong>
                            <span>моих заявок</span>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.tabs}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('available')}
                        className={`${styles.tabButton} ${activeTab === 'available' ? styles.tabButtonActive : ''}`}
                    >
                        Доступные заявки ({availableRequests.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('my')}
                        className={`${styles.tabButton} ${activeTab === 'my' ? styles.tabButtonActive : ''}`}
                    >
                        Мои заявки ({myRequests.length})
                    </button>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>⏳</div>
                        <h3>Загружаем заявки</h3>
                        <p>Получаем актуальные данные по доступным и принятым перевозкам.</p>
                    </div>
                ) : activeRequests.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>Заявок пока нет</h3>
                        <p>
                            {activeTab === 'available'
                                ? 'Сейчас нет доступных заявок для принятия.'
                                : 'У вас пока нет принятых заявок.'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.requestsList}>
                        {activeRequests.map((request) => (
                            <div key={request.id} className={styles.requestCard}>
                                <div className={styles.tenderCardTop}>
                                    <span className={styles.tenderNumber}>#{request.id}</span>
                                    <span
                                        className={styles.statusPill}
                                        data-status={getStatusKey(request.status)}
                                    >
                                        {getStatusLabel(request.status)}
                                    </span>
                                </div>

                                <h3>{request.cargo?.name || 'Груз без названия'}</h3>

                                <div className={styles.tenderInfo}>
                                    <p>
                                        <strong>Грузовладелец</strong>
                                        <span>{request.ownerName || '—'}</span>
                                    </p>

                                    {request.pickupDate && (
                                        <p>
                                            <strong>Дата забора</strong>
                                            <span>{request.pickupDate}</span>
                                        </p>
                                    )}

                                    {request.deliveryDate && (
                                        <p>
                                            <strong>Дата доставки</strong>
                                            <span>{request.deliveryDate}</span>
                                        </p>
                                    )}
                                </div>

                                {request.comment && (
                                    <div className={styles.conditionsBox}>
                                        <strong>Комментарий</strong>
                                        <p>{request.comment}</p>
                                    </div>
                                )}

                                {activeTab === 'available' && (
                                    <div className={styles.requestActions}>
                                        {request.status === 'NEW' || request.status === 'PENDING' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className={styles.acceptRequestButton}
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                >
                                                    Принять заявку
                                                </button>

                                                <button
                                                    type="button"
                                                    className={styles.declineRequestButton}
                                                    onClick={() => handleDeclineRequest(request.id)}
                                                >
                                                    Отклонить
                                                </button>
                                            </>
                                        ) : (
                                            <div className={styles.requestNote}>
                                                {getStatusLabel(request.status)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'my' && (
                                    <div className={styles.requestActions}>
                                        {(request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={styles.chatRequestButton}
                                                    onClick={() => openChat(request.id)}
                                                >
                                                    {request.status === 'ACCEPTED' ? 'Начать чат' : 'Чат'}
                                                </button>

                                                <label className={styles.statusControl}>
                                                    <strong>Статус</strong>
                                                    <select
                                                        value={request.status}
                                                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                    >
                                                        <option value="ACCEPTED">Принята</option>
                                                        <option value="IN_PROGRESS">В процессе</option>
                                                        <option value="DECLINED">Отклонена</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}

                                        {request.status === 'DECLINED' && (
                                            <div className={styles.declinedNote}>
                                                Заявка отклонена
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {showChat && chatRequestId && currentUserId > 0 && (
                    <RequestChat
                        requestId={chatRequestId}
                        currentUserId={currentUserId}
                        isOwner={false}
                        onClose={() => {
                            setShowChat(false)
                            setChatRequestId(null)
                        }}
                    />
                )}
            </div>
        </Layout>
    )
}

export default CarrierRequestsPage