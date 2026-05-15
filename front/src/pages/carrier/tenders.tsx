import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../../services/authService'
import api from '../../services/api'
import Layout from '../../components/Layout'
import styles from '../../styles/client/ClientHome.module.sass'
import { getStatusKey, getStatusLabel } from '../../utils/statusLabels'

interface TenderBid {
    id: number
    price: number
    deliveryDate: string
    comment?: string
    status: string
}

interface Tender {
    id: number
    cargoId: number
    cargoName: string
    status: string
    endAt: string
    conditions?: string
    expectedPrice?: number
    bids?: TenderBid[]
    cargo?: {
        name: string
        description?: string
        weight?: number
    }
}

const CarrierTendersPage = () => {
    const router = useRouter()

    const [tenders, setTenders] = useState<Tender[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
    const [bidForm, setBidForm] = useState({ price: '', deliveryDate: '', comment: '' })
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isCarrier()) {
            router.push('/')
            return
        }

        fetchTenders()
    }, [])

    const fetchTenders = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await api.get('/api/carrier/tenders')
            setTenders(response.data)
        } catch (err: any) {
            const msg = err.response?.data
            setError(typeof msg === 'string' ? msg : 'Ошибка при загрузке тендеров')
        } finally {
            setLoading(false)
        }
    }

    const openTender = async (tenderId: number) => {
        try {
            setError(null)

            const response = await api.get(`/api/carrier/tenders/${tenderId}`)
            setSelectedTender(response.data)

            const myBid = response.data.bids?.[0]

            if (myBid) {
                setBidForm({
                    price: String(myBid.price),
                    deliveryDate: myBid.deliveryDate?.split('T')[0] || myBid.deliveryDate || '',
                    comment: myBid.comment || '',
                })
            } else {
                setBidForm({ price: '', deliveryDate: '', comment: '' })
            }
        } catch (err: any) {
            const msg = err.response?.data
            setError(typeof msg === 'string' ? msg : 'Ошибка при загрузке тендера')
        }
    }

    const handleSubmitBid = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedTender) return

        try {
            setSubmitting(true)
            setError(null)
            setSuccessMessage(null)

            await api.post(`/api/carrier/tenders/${selectedTender.id}/bids`, {
                price: parseFloat(bidForm.price),
                deliveryDate: bidForm.deliveryDate,
                comment: bidForm.comment || null,
            })

            await openTender(selectedTender.id)
            fetchTenders()
            setSuccessMessage('Предложение успешно отправлено.')
        } catch (err: any) {
            const msg = err.response?.data
            setError(typeof msg === 'string' ? msg : 'Ошибка при отправке предложения')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (value: string) => {
        if (!value) return '—'
        return new Date(value).toLocaleString('ru-RU')
    }

    const navigation = {
        menu: [
            { title: 'Тендеры', url: '/carrier/tenders' },
            { title: 'Заявки', url: '/carrier/requests' },
            { title: 'Чаты', url: '/carrier/chats' },
            { title: 'Транспорт', url: '/carrier/transports' },
            { title: 'Настройки', url: '/carrier/settings' },
        ],
    }

    const myBid = selectedTender?.bids?.[0]

    return (
        <Layout
            title="Тендеры"
            navigationPaths={navigation}
            showLogout
            onLogout={() => {
                authService.logout()
                router.push('/')
            }}
        >
            <div className={styles.container}>
                <div className={styles.tendersHero}>
                    <div>
                        <span className={styles.kicker}>Тендеры для перевозчика</span>
                        <h1>Открытые тендеры</h1>
                        <p>
                            Выбирайте подходящие грузы, предлагайте свою цену и срок доставки. После принятия
                            предложения владелец груза создаст заявку на перевозку.
                        </p>
                    </div>

                    <div className={styles.tendersStats}>
                        <div>
                            <strong>{tenders.length}</strong>
                            <span>доступно</span>
                        </div>
                        <div>
                            <strong>{tenders.filter((tender) => tender.status === 'OPEN').length}</strong>
                            <span>открытых</span>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}


                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>⏳</div>
                        <h3>Загружаем тендеры</h3>
                        <p>Получаем актуальные предложения от владельцев грузов.</p>
                    </div>
                ) : tenders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>Открытых тендеров пока нет</h3>
                        <p>Когда владельцы грузов откроют тендеры, они появятся на этой странице.</p>
                    </div>
                ) : (
                    <div className={styles.tendersList}>
                        {tenders.map((tender) => (
                            <div key={tender.id} className={styles.tenderCard}>
                                <div className={styles.tenderCardTop}>
                                    <span className={styles.tenderNumber}>№{tender.id}</span>
                                    <span
                                        className={styles.statusPill}
                                        data-status={getStatusKey(tender.status)}
                                    >
                                        {getStatusLabel(tender.status)}
                                    </span>
                                </div>

                                <h3>{tender.cargoName}</h3>

                                <div className={styles.tenderInfo}>
                                    <p>
                                        <strong>Окончание</strong>
                                        <span>{formatDate(tender.endAt)}</span>
                                    </p>

                                    {tender.expectedPrice != null && (
                                        <p>
                                            <strong>Ожидаемая цена</strong>
                                            <span>{tender.expectedPrice} руб.</span>
                                        </p>
                                    )}

                                    {tender.conditions && (
                                        <p>
                                            <strong>Условия</strong>
                                            <span>{tender.conditions}</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className={styles.primaryAction}
                                    onClick={() => openTender(tender.id)}
                                >
                                    Подробнее
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {selectedTender && (
                    <div
                        className={styles.modalOverlay}
                        onClick={(e) => e.target === e.currentTarget && setSelectedTender(null)}
                    >
                        <div className={styles.tenderModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHead}>
                                <div>
                                    <span className={styles.kicker}>Предложение на тендер</span>
                                    <h2>{selectedTender.cargoName}</h2>
                                </div>

                                <button
                                    type="button"
                                    className={styles.closeModalButton}
                                    onClick={() => setSelectedTender(null)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className={styles.tenderDetailGrid}>
                                <p>
                                    <strong>Статус тендера</strong>
                                    <span
                                        className={styles.statusPill}
                                        data-status={getStatusKey(selectedTender.status)}
                                    >
                                        {getStatusLabel(selectedTender.status)}
                                    </span>
                                </p>

                                <p>
                                    <strong>Окончание</strong>
                                    <span>{formatDate(selectedTender.endAt)}</span>
                                </p>

                                {selectedTender.cargo?.weight != null && (
                                    <p>
                                        <strong>Вес груза</strong>
                                        <span>{selectedTender.cargo.weight} кг</span>
                                    </p>
                                )}

                                {selectedTender.expectedPrice != null && (
                                    <p>
                                        <strong>Ожидаемая цена</strong>
                                        <span>{selectedTender.expectedPrice} руб.</span>
                                    </p>
                                )}
                            </div>

                            {selectedTender.cargo?.description && (
                                <div className={styles.conditionsBox}>
                                    <strong>Описание груза</strong>
                                    <p>{selectedTender.cargo.description}</p>
                                </div>
                            )}

                            {selectedTender.conditions && (
                                <div className={styles.conditionsBox}>
                                    <strong>Условия тендера</strong>
                                    <p>{selectedTender.conditions}</p>
                                </div>
                            )}

                            {myBid && (
                                <div className={styles.myBidBox}>
                                    <div className={styles.bidTop}>
                                        <div>
                                            <strong>Ваше предложение</strong>
                                            <span>Уже отправлено на этот тендер</span>
                                        </div>

                                        <span
                                            className={styles.statusPill}
                                            data-status={getStatusKey(myBid.status)}
                                        >
                                            {getStatusLabel(myBid.status)}
                                        </span>
                                    </div>

                                    <div className={styles.bidInfo}>
                                        <p>
                                            <strong>Цена</strong>
                                            <span>{myBid.price} руб.</span>
                                        </p>
                                        <p>
                                            <strong>Доставка</strong>
                                            <span>{myBid.deliveryDate}</span>
                                        </p>
                                    </div>

                                    {myBid.comment && (
                                        <div className={styles.bidComment}>
                                            <strong>Комментарий</strong>
                                            <p>{myBid.comment}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedTender.status === 'OPEN' && (!myBid || myBid.status === 'PENDING') && (
                                <form className={styles.bidForm} onSubmit={handleSubmitBid}>
                                    <div className={styles.modalSectionTitle}>
                                        <h3>{myBid ? 'Обновить предложение' : 'Отправить предложение'}</h3>
                                    </div>

                                    <label>
                                        Цена, руб. *
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            placeholder="Например: 450"
                                            value={bidForm.price}
                                            onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                                        />
                                    </label>

                                    <label>
                                        Срок доставки *
                                        <input
                                            type="date"
                                            required
                                            value={bidForm.deliveryDate}
                                            onChange={(e) => setBidForm({ ...bidForm, deliveryDate: e.target.value })}
                                        />
                                    </label>

                                    <label>
                                        Комментарий
                                        <textarea
                                            placeholder="Например: могу забрать груз завтра утром"
                                            value={bidForm.comment}
                                            onChange={(e) => setBidForm({ ...bidForm, comment: e.target.value })}
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        className={styles.acceptBidButton}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Отправка...' : myBid ? 'Обновить предложение' : 'Отправить предложение'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default CarrierTendersPage