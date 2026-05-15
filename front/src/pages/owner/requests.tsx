import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'
import api from '../../services/api'
import Layout from '../../components/Layout'
import ChatBot from '../../components/ChatBot'
import RequestChat from '../../components/RequestChat'
import RouteMapView from '../../components/RouteMapView'
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
    carrierName?: string
    carrierId?: number
    hasRoute?: boolean
    hasReview?: boolean
}

interface Carrier {
    id: number
    name: string
    companyName?: string
    phone?: string
    email?: string
    averageRating?: number
}

const OwnerRequestsPage = () => {
    const router = useRouter()

    const [requests, setRequests] = useState<Request[]>([])
    const [cargos, setCargos] = useState<any[]>([])
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingRequest, setEditingRequest] = useState<Request | null>(null)

    const [showCarriersModal, setShowCarriersModal] = useState(false)
    const [allCarriers, setAllCarriers] = useState<Carrier[]>([])
    const [loadingCarriers, setLoadingCarriers] = useState(false)

    const [showChat, setShowChat] = useState(false)
    const [chatRequestId, setChatRequestId] = useState<number | null>(null)
    const [currentUserId, setCurrentUserId] = useState<number>(0)

    const [showRouteModal, setShowRouteModal] = useState(false)
    const [viewingRoute, setViewingRoute] = useState<any>(null)

    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewingCarrierId, setReviewingCarrierId] = useState<number | null>(null)
    const [reviewingCarrierName, setReviewingCarrierName] = useState<string>('')

    const [showReviewsModal, setShowReviewsModal] = useState(false)
    const [viewingCarrierReviews, setViewingCarrierReviews] = useState<any[]>([])
    const [viewingCarrierNameForReviews, setViewingCarrierNameForReviews] = useState<string>('')

    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: '',
    })

    const [submittingReview, setSubmittingReview] = useState(false)

    const [formData, setFormData] = useState({
        cargoId: '',
        carrierId: '',
        pickupDate: '',
        deliveryDate: '',
        comment: '',
    })

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/')
            return
        }

        fetchCurrentUserId()
        fetchRequests()
        fetchCargos()
        fetchCarriers()
    }, [])

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

    const fetchCargos = async () => {
        try {
            const response = await api.get('/api/owner/cargo')
            setCargos(response.data)
        } catch (err: any) {
            console.error('Ошибка при загрузке грузов:', err)
        }
    }

    const fetchCarriers = async () => {
        try {
            const response = await api.get('/api/owner/carriers')
            const carriersData = response.data

            const carriersList = carriersData.map((carrier: any) => ({
                id: carrier.id,
                name: carrier.companyName || 'Без названия',
            }))

            setCarriers(carriersList)
        } catch (err: any) {
            console.error('Ошибка при загрузке перевозчиков:', err)

            try {
                const requestsResponse = await api.get('/api/owner/requests')
                const requestsData = requestsResponse.data
                const uniqueCarriers = new Map<number, string>()

                requestsData.forEach((req: any) => {
                    if (req.carrierId && req.carrierName) {
                        uniqueCarriers.set(req.carrierId, req.carrierName)
                    }
                })

                const carriersList = Array.from(uniqueCarriers.entries()).map(([id, name]) => ({
                    id,
                    name,
                }))

                setCarriers(carriersList)
            } catch (fallbackErr: any) {
                console.error('Ошибка при загрузке перевозчиков из заявок:', fallbackErr)
            }
        }
    }

    const fetchAllCarriers = async () => {
        try {
            setLoadingCarriers(true)

            const response = await api.get('/api/owner/carriers')
            const carriersData = response.data

            const formattedCarriers = carriersData.map((carrier: any) => ({
                ...carrier,
                name: carrier.companyName || 'Без названия',
            }))

            setAllCarriers(formattedCarriers)
        } catch (err: any) {
            console.error('Ошибка при загрузке всех перевозчиков:', err)
            setError('Ошибка при загрузке перевозчиков')
        } finally {
            setLoadingCarriers(false)
        }
    }

    const fetchRequests = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await api.get('/api/owner/requests')
            setRequests(response.data)
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при загрузке заявок')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await api.post('/api/owner/requests', {
                cargoId: parseInt(formData.cargoId),
                carrierId: formData.carrierId ? parseInt(formData.carrierId) : null,
                pickupDate: formData.pickupDate || null,
                deliveryDate: formData.deliveryDate || null,
                comment: formData.comment,
            })

            setShowCreateModal(false)
            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' })
            fetchRequests()
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при создании заявки')
        }
    }

    const handleEditRequest = (request: Request) => {
        setEditingRequest(request)

        const requestWithCarrier = requests.find((r) => r.id === request.id)
        const carrierId = (requestWithCarrier as any)?.carrierId?.toString() || ''

        setFormData({
            cargoId: request.cargoId.toString(),
            carrierId,
            pickupDate: request.pickupDate || '',
            deliveryDate: request.deliveryDate || '',
            comment: request.comment || '',
        })

        fetchCarriers()
        setShowEditModal(true)
    }

    const handleUpdateRequest = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editingRequest) return

        try {
            const carrierIdValue =
                formData.carrierId && formData.carrierId.trim() !== ''
                    ? parseInt(formData.carrierId)
                    : -1

            await api.put(`/api/owner/requests/${editingRequest.id}`, {
                pickupDate: formData.pickupDate || null,
                deliveryDate: formData.deliveryDate || null,
                comment: formData.comment,
                carrierId: carrierIdValue,
            })

            setShowEditModal(false)
            setEditingRequest(null)
            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' })
            fetchRequests()
            fetchCarriers()
            setError(null)
        } catch (err: any) {
            console.error('Error updating request:', err)
            const errorMessage = err.response?.data?.message || err.response?.data || 'Ошибка при обновлении заявки'
            setError(errorMessage)
        }
    }

    const handleDeleteRequest = async (id: number) => {
        if (!confirm('Удалить заявку?')) return

        try {
            await api.delete(`/api/owner/requests/${id}`)
            fetchRequests()
        } catch (err: any) {
            setError(err.response?.data || 'Ошибка при удалении заявки')
        }
    }

    const handleOpenReviewModal = (carrierId: number, carrierName: string) => {
        setReviewingCarrierId(carrierId)
        setReviewingCarrierName(carrierName)
        setReviewData({ rating: 0, comment: '' })
        setShowReviewModal(true)
    }

    const handleSubmitReview = async () => {
        if (!reviewingCarrierId) return

        if (reviewData.rating === 0) {
            setError('Пожалуйста, выберите рейтинг')
            return
        }

        try {
            setSubmittingReview(true)

            await api.post('/api/owner/reviews', {
                carrierId: reviewingCarrierId,
                rating: reviewData.rating,
                comment: reviewData.comment,
            })

            setShowReviewModal(false)
            setReviewingCarrierId(null)
            setReviewingCarrierName('')
            setReviewData({ rating: 0, comment: '' })
            fetchRequests()
        } catch (err: any) {
            console.error('Ошибка отправки отзыва:', err)
            setError(err.response?.data?.message || 'Ошибка отправки отзыва')
        } finally {
            setSubmittingReview(false)
        }
    }

    const openRoute = async (requestId: number) => {
        try {
            const response = await api.get(`/api/owner/requests/${requestId}/route`)
            const route = response.data

            if (route) {
                setViewingRoute(route)
                setShowRouteModal(true)
            }
        } catch (err) {
            console.error('Ошибка загрузки маршрута:', err)
            setError('Ошибка загрузки маршрута')
        }
    }

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Тендеры', url: '/owner/tenders' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Чаты', url: '/owner/chats' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    }

    return (
        <Layout
            title="Заявки"
            navigationPaths={navigation}
            showLogout
            onLogout={() => {
                authService.logout()
                router.push('/')
            }}
        >
            <div className={styles.container}>
                <div className={styles.ownerRequestsHero}>
                    <div>
                        <span className={styles.kicker}>Кабинет грузовладельца</span>
                        <h1>Управление заявками</h1>
                        <p>
                            Создавайте заявки на перевозку, назначайте перевозчиков, отслеживайте маршруты,
                            общайтесь в чате и оставляйте отзывы.
                        </p>
                    </div>

                    <div className={styles.ownerRequestsStats}>
                        <div>
                            <strong>{requests.length}</strong>
                            <span>заявок</span>
                        </div>
                        <div>
                            <strong>{requests.filter((request) => request.status === 'IN_PROGRESS').length}</strong>
                            <span>в процессе</span>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.ownerActions}>
                    <button
                        type="button"
                        className={styles.createRequestButton}
                        onClick={() => {
                            setFormData({ cargoId: '', carrierId: '', pickupDate: '', deliveryDate: '', comment: '' })
                            setShowCreateModal(true)
                        }}
                    >
                        Создать заявку
                    </button>

                    <button
                        type="button"
                        className={styles.carriersButton}
                        onClick={() => {
                            fetchAllCarriers()
                            setShowCarriersModal(true)
                        }}
                    >
                        Все перевозчики
                    </button>
                </div>

                {showCreateModal && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowCreateModal(false)
                            }
                        }}
                    >
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Новая заявка</span>
                                    <h2>Создать заявку</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.ownerFormCard}>
                                <form className={styles.ownerForm} onSubmit={handleCreateRequest}>
                                    <div className={styles.ownerFormGroup}>
                                        <label>Груз — выберите груз для перевозки *</label>
                                        <select
                                            value={formData.cargoId}
                                            onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })}
                                            required
                                        >
                                            <option value="">Выберите груз</option>
                                            {cargos.map((cargo) => (
                                                <option key={cargo.id} value={cargo.id}>
                                                    {cargo.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Перевозчик — можно оставить пустым</label>
                                        <select
                                            value={formData.carrierId}
                                            onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                        >
                                            <option value="">Не назначен</option>
                                            {carriers.map((carrier) => (
                                                <option key={carrier.id} value={carrier.id.toString()}>
                                                    {carrier.name}
                                                </option>
                                            ))}
                                        </select>

                                        {carriers.length === 0 && (
                                            <p className={styles.ownerHint}>
                                                Нет доступных перевозчиков. Используйте кнопку «Все перевозчики».
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Дата забора</label>
                                        <input
                                            type="date"
                                            value={formData.pickupDate}
                                            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Дата доставки</label>
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Комментарий</label>
                                        <textarea
                                            placeholder="Введите комментарий..."
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerModalActions}>
                                        <button type="submit" className={styles.ownerSubmitButton}>
                                            Создать
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.ownerCancelButton}
                                            onClick={() => setShowCreateModal(false)}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {showEditModal && editingRequest && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowEditModal(false)
                                setEditingRequest(null)
                            }
                        }}
                    >
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Редактирование</span>
                                    <h2>Заявка #{editingRequest.id}</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingRequest(null)
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.ownerFormCard}>
                                <form className={styles.ownerForm} onSubmit={handleUpdateRequest}>
                                    <div className={styles.ownerFormGroup}>
                                        <label>Перевозчик</label>
                                        <select
                                            value={formData.carrierId}
                                            onChange={(e) => setFormData({ ...formData, carrierId: e.target.value })}
                                        >
                                            <option value="">Не назначен</option>
                                            {carriers.map((carrier) => (
                                                <option key={carrier.id} value={carrier.id.toString()}>
                                                    {carrier.name}
                                                </option>
                                            ))}
                                        </select>

                                        {carriers.length === 0 && (
                                            <p className={styles.ownerHint}>
                                                Нет доступных перевозчиков. Используйте кнопку «Все перевозчики».
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Дата отправления</label>
                                        <input
                                            type="date"
                                            value={formData.pickupDate}
                                            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Дата доставки</label>
                                        <input
                                            type="date"
                                            value={formData.deliveryDate}
                                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerFormGroup}>
                                        <label>Комментарий</label>
                                        <textarea
                                            placeholder="Введите комментарий..."
                                            value={formData.comment}
                                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                        />
                                    </div>

                                    <div className={styles.ownerModalActions}>
                                        <button type="submit" className={styles.ownerSubmitButton}>
                                            Сохранить
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.ownerCancelButton}
                                            onClick={() => {
                                                setShowEditModal(false)
                                                setEditingRequest(null)
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>⏳</div>
                        <h3>Загружаем заявки</h3>
                        <p>Получаем актуальные данные по вашим перевозкам.</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>Заявок пока нет</h3>
                        <p>Создайте первую заявку на перевозку груза.</p>
                    </div>
                ) : (
                    <div className={styles.ownerRequestsList}>
                        {requests.map((request) => (
                            <div key={request.id} className={styles.ownerRequestCard}>
                                <div className={styles.ownerRequestTop}>
                                    <span className={styles.ownerRequestNumber}>#{request.id}</span>
                                    <span
                                        className={styles.statusPill}
                                        data-status={getStatusKey(request.status)}
                                    >
                                        {getStatusLabel(request.status)}
                                    </span>
                                </div>

                                <h3>{request.cargo?.name || 'Груз без названия'}</h3>

                                <div className={styles.ownerRequestInfo}>
                                    {request.carrierName && (
                                        <p>
                                            <strong>Перевозчик</strong>
                                            <span>{request.carrierName}</span>
                                        </p>
                                    )}

                                    {request.pickupDate && (
                                        <p>
                                            <strong>Дата отправления</strong>
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

                                <div className={styles.ownerRequestActions}>
                                    {!request.hasRoute && (
                                        <>
                                            <button
                                                type="button"
                                                className={styles.editRequestButton}
                                                onClick={() => handleEditRequest(request)}
                                            >
                                                Редактировать
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.deleteRequestButton}
                                                onClick={() => handleDeleteRequest(request.id)}
                                            >
                                                Удалить
                                            </button>
                                        </>
                                    )}

                                    {request.hasRoute && (
                                        <button
                                            type="button"
                                            className={styles.routeButton}
                                            onClick={() => openRoute(request.id)}
                                        >
                                            Маршрут
                                        </button>
                                    )}

                                    {(request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
                                        <button
                                            type="button"
                                            className={styles.ownerChatButton}
                                            onClick={() => {
                                                setChatRequestId(request.id)
                                                setShowChat(true)
                                            }}
                                        >
                                            {request.status === 'ACCEPTED' ? 'Начать чат' : 'Чат'}
                                        </button>
                                    )}

                                    {request.carrierId && request.carrierName && !request.hasReview && (
                                        <button
                                            type="button"
                                            className={styles.reviewButton}
                                            onClick={() => handleOpenReviewModal(request.carrierId!, request.carrierName!)}
                                        >
                                            Оставить отзыв
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showCarriersModal && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowCarriersModal(false)
                            }
                        }}
                    >
                        <div
                            className={`${styles.modal} ${styles.carriersModal}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Перевозчики</span>
                                    <h2>Все перевозчики</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => setShowCarriersModal(false)}
                                >
                                    ×
                                </button>
                            </div>

                            {loadingCarriers ? (
                                <div className={styles.emptyStateSmall}>
                                    <div className={styles.emptyIcon}>⏳</div>
                                    <h3>Загрузка</h3>
                                    <p>Загрузка перевозчиков...</p>
                                </div>
                            ) : allCarriers.length === 0 ? (
                                <div className={styles.emptyStateSmall}>
                                    <div className={styles.emptyIcon}>🚚</div>
                                    <h3>Нет перевозчиков</h3>
                                    <p>В системе пока нет зарегистрированных перевозчиков.</p>
                                </div>
                            ) : (
                                <div className={styles.carriersGrid}>
                                    {allCarriers.map((carrier) => (
                                        <div key={carrier.id} className={styles.carrierCard}>
                                            <h3>{carrier.companyName || carrier.name || 'Без названия'}</h3>

                                            {carrier.phone && (
                                                <p>
                                                    <strong>Телефон:</strong> {carrier.phone}
                                                </p>
                                            )}

                                            {carrier.email && (
                                                <p>
                                                    <strong>Email:</strong> {carrier.email}
                                                </p>
                                            )}

                                            <div className={styles.ratingRow}>
                                                <strong>Рейтинг:</strong>
                                                {carrier.averageRating && carrier.averageRating > 0 ? (
                                                    <span className={styles.ratingValue}>
                                                        {carrier.averageRating.toFixed(1)} / 5.0
                                                    </span>
                                                ) : (
                                                    <span className={styles.ownerMuted}>Нет отзывов</span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.reviewsButton}
                                                onClick={async () => {
                                                    try {
                                                        const response = await api.get(`/api/owner/reviews/carrier/${carrier.id}`)
                                                        setViewingCarrierReviews(response.data)
                                                        setViewingCarrierNameForReviews(
                                                            carrier.companyName || carrier.name || 'Без названия'
                                                        )
                                                        setShowReviewsModal(true)
                                                    } catch (err) {
                                                        console.error('Ошибка загрузки отзывов:', err)
                                                        setError('Ошибка загрузки отзывов')
                                                    }
                                                }}
                                            >
                                                Просмотреть отзывы
                                            </button>

                                            <p className={styles.ownerMuted}>ID: {carrier.id}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showChat && chatRequestId && currentUserId > 0 && (
                    <RequestChat
                        requestId={chatRequestId}
                        currentUserId={currentUserId}
                        isOwner={true}
                        onClose={() => {
                            setShowChat(false)
                            setChatRequestId(null)
                            fetchRequests()
                        }}
                    />
                )}

                {showRouteModal && viewingRoute && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowRouteModal(false)
                                setViewingRoute(null)
                            }
                        }}
                    >
                        <div
                            className={styles.modalContent}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Маршрут</span>
                                    <h2>Маршрут заявки</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => {
                                        setShowRouteModal(false)
                                        setViewingRoute(null)
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.routeInfoBox}>
                                <p>
                                    <strong>От:</strong> {viewingRoute.startAddress}
                                </p>
                                <p>
                                    <strong>До:</strong> {viewingRoute.endAddress}
                                </p>
                                <p>
                                    Создан: {new Date(viewingRoute.createdAt).toLocaleString('ru-RU')}
                                </p>
                            </div>

                            <RouteMapView
                                startLat={viewingRoute.startLat}
                                startLng={viewingRoute.startLng}
                                endLat={viewingRoute.endLat}
                                endLng={viewingRoute.endLng}
                                startAddress={viewingRoute.startAddress}
                                endAddress={viewingRoute.endAddress}
                                height="500px"
                            />
                        </div>
                    </div>
                )}

                {showReviewModal && reviewingCarrierId && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowReviewModal(false)
                                setReviewingCarrierId(null)
                                setReviewingCarrierName('')
                                setReviewData({ rating: 0, comment: '' })
                            }
                        }}
                    >
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Отзыв</span>
                                    <h2>Оставить отзыв</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => {
                                        setShowReviewModal(false)
                                        setReviewingCarrierId(null)
                                        setReviewingCarrierName('')
                                        setReviewData({ rating: 0, comment: '' })
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.ownerFormCard}>
                                <div className={styles.ownerFormGroup}>
                                    <label>Перевозчик</label>
                                    <p className={styles.ownerHint}>{reviewingCarrierName}</p>
                                </div>

                                <div className={styles.ownerFormGroup}>
                                    <label>Рейтинг *</label>
                                    <div className={styles.starsInput}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`${styles.starButton} ${star <= reviewData.rating ? styles.active : ''}`}
                                                onClick={() => setReviewData({ ...reviewData, rating: star })}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>

                                    {reviewData.rating > 0 && (
                                        <p className={styles.ownerHint}>
                                            Вы выбрали: {reviewData.rating}{' '}
                                            {reviewData.rating === 1 ? 'звезда' : reviewData.rating < 5 ? 'звезды' : 'звезд'}
                                        </p>
                                    )}
                                </div>

                                <div className={styles.ownerFormGroup}>
                                    <label>Комментарий</label>
                                    <textarea
                                        className={styles.reviewTextArea}
                                        value={reviewData.comment}
                                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                        placeholder="Оставьте ваш отзыв о работе перевозчика..."
                                    />
                                </div>

                                <div className={styles.ownerModalActions}>
                                    <button
                                        type="button"
                                        className={styles.ownerSubmitButton}
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview || reviewData.rating === 0}
                                    >
                                        {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.ownerCancelButton}
                                        onClick={() => {
                                            setShowReviewModal(false)
                                            setReviewingCarrierId(null)
                                            setReviewingCarrierName('')
                                            setReviewData({ rating: 0, comment: '' })
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showReviewsModal && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowReviewsModal(false)
                                setViewingCarrierReviews([])
                                setViewingCarrierNameForReviews('')
                            }
                        }}
                    >
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.ownerModalHead}>
                                <div>
                                    <span className={styles.kicker}>Отзывы</span>
                                    <h2>{viewingCarrierNameForReviews}</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ownerCloseButton}
                                    onClick={() => {
                                        setShowReviewsModal(false)
                                        setViewingCarrierReviews([])
                                        setViewingCarrierNameForReviews('')
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {viewingCarrierReviews.length === 0 ? (
                                <div className={styles.emptyStateSmall}>
                                    <div className={styles.emptyIcon}>★</div>
                                    <h3>Нет отзывов</h3>
                                    <p>Для этого перевозчика пока нет отзывов.</p>
                                </div>
                            ) : (
                                <div className={styles.reviewsList}>
                                    {viewingCarrierReviews.map((review: any) => (
                                        <div key={review.id} className={styles.reviewCard}>
                                            <div className={styles.ratingRow}>
                                                <strong>{review.ownerName || 'Грузовладелец'}</strong>

                                                <div className={styles.starsView}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span
                                                            key={star}
                                                            className={`${styles.starButton} ${star <= review.rating ? styles.active : ''}`}
                                                        >

                                                        </span>
                                                    ))}
                                                </div>

                                                <span className={styles.ratingValue}>{review.rating} / 5</span>
                                            </div>

                                            {review.comment && <p>{review.comment}</p>}

                                            <p className={styles.ownerMuted}>
                                                {new Date(review.createdAt).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <ChatBot />
            </div>
        </Layout>
    )
}

export default OwnerRequestsPage