import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { loadYandexMaps } from '../utils/yandexMapsLoader';
import { geocodingService } from '../services/geocodingService';
import RouteMapView from './RouteMapView';
import styles from '../styles/client/ClientHome.module.sass';

interface Message {
    id: number;
    requestId: number;
    senderId: number;
    senderName: string;
    receiverId: number;
    receiverName: string;
    text: string;
    type: 'TEXT' | 'ROUTE' | 'SYSTEM';
    createdAt: string;
}

interface RouteData {
    startAddress: string;
    endAddress: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    distance?: number; // расстояние в метрах
    time?: number; // время в секундах
}

interface RequestChatProps {
    requestId: number;
    currentUserId: number;
    isOwner: boolean;
    onClose: () => void;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const RequestChat: React.FC<RequestChatProps> = ({ requestId, currentUserId, isOwner, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRouteBuilder, setShowRouteBuilder] = useState(false);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [sendingRoute, setSendingRoute] = useState(false);
    const [startAddressInput, setStartAddressInput] = useState('');
    const [endAddressInput, setEndAddressInput] = useState('');
    const [geocodingStart, setGeocodingStart] = useState(false);
    const [geocodingEnd, setGeocodingEnd] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const routePolylineRef = useRef<any>(null);
    const startPlacemarkRef = useRef<any>(null);
    const endPlacemarkRef = useRef<any>(null);
    const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Обновляем каждые 3 секунды
        return () => clearInterval(interval);
    }, [requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (showRouteBuilder && mapRef.current) {
            initRouteMap();
        }
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
            }
        };
    }, [showRouteBuilder]);

    // Обновляем маршрут на карте при изменении routeData
    useEffect(() => {
        if (showRouteBuilder && mapInstanceRef.current && window.ymaps && routeData) {
            // Небольшая задержка, чтобы убедиться, что карта готова
            const timer = setTimeout(() => {
                updateRouteOnMap();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [routeData?.startLat, routeData?.startLng, routeData?.endLat, routeData?.endLng, showRouteBuilder]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/api/messages/request/${requestId}`);
            setMessages(response.data);
            setLoading(false);
        } catch (err: any) {
            console.error('Ошибка загрузки сообщений:', err);
            setError('Ошибка загрузки сообщений');
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('/api/messages', {
                requestId,
                text: newMessage,
                type: 'TEXT'
            });
            setNewMessage('');
            fetchMessages();
        } catch (err: any) {
            console.error('Ошибка отправки сообщения:', err);
            setError('Ошибка отправки сообщения');
        }
    };

    const initRouteMap = async () => {
        try {
            const ymaps = await loadYandexMaps();
            if (!ymaps || !mapRef.current) return;

            const map = new window.ymaps.Map(mapRef.current, {
                center: [53.9, 27.5667], // Минск по умолчанию
                zoom: 10,
                controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
            });

            mapInstanceRef.current = map;
        } catch (error) {
            console.error('Ошибка инициализации карты:', error);
        }
    };

    const handleStartAddressChange = (address: string) => {
        setStartAddressInput(address);
        setError(null);

        // Очищаем предыдущий таймаут
        if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current);
        }

        if (!address.trim()) {
            setGeocodingStart(false);
            setRouteData(prev => prev ? {
                ...prev,
                startAddress: '',
                startLat: 0,
                startLng: 0
            } : null);
            return;
        }

        setGeocodingStart(true);

        // Debounce для геокодинга адреса (800мс после окончания ввода)
        geocodeTimeoutRef.current = setTimeout(() => {
            if (!window.ymaps || !address.trim()) {
                setGeocodingStart(false);
                return;
            }

            window.ymaps.geocode(address, {
                results: 1
            }).then((res: any) => {
                const firstGeoObject = res.geoObjects.get(0);
                if (firstGeoObject) {
                    const coords = firstGeoObject.geometry.getCoordinates();
                    const foundAddress = firstGeoObject.getAddressLine();
                    
                    setRouteData(prev => ({
                        startAddress: foundAddress || address,
                        startLat: coords[0],
                        startLng: coords[1],
                        endAddress: prev?.endAddress || '',
                        endLat: prev?.endLat || 0,
                        endLng: prev?.endLng || 0
                    } as RouteData));
                    setGeocodingStart(false);
                } else {
                    setError('Не удалось найти адрес отправления');
                    setGeocodingStart(false);
                }
            }).catch((err: any) => {
                console.error('Yandex geocoding error:', err);
                setError('Ошибка при поиске адреса отправления');
                setGeocodingStart(false);
            });
        }, 800);
    };

    const handleEndAddressChange = (address: string) => {
        setEndAddressInput(address);
        setError(null);

        // Очищаем предыдущий таймаут
        if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current);
        }

        if (!address.trim()) {
            setGeocodingEnd(false);
            setRouteData(prev => prev ? {
                ...prev,
                endAddress: '',
                endLat: 0,
                endLng: 0
            } : null);
            return;
        }

        setGeocodingEnd(true);

        // Debounce для геокодинга адреса (800мс после окончания ввода)
        geocodeTimeoutRef.current = setTimeout(() => {
            if (!window.ymaps || !address.trim()) {
                setGeocodingEnd(false);
                return;
            }

            window.ymaps.geocode(address, {
                results: 1
            }).then((res: any) => {
                const firstGeoObject = res.geoObjects.get(0);
                if (firstGeoObject) {
                    const coords = firstGeoObject.geometry.getCoordinates();
                    const foundAddress = firstGeoObject.getAddressLine();
                    
                    setRouteData(prev => ({
                        endAddress: foundAddress || address,
                        endLat: coords[0],
                        endLng: coords[1],
                        startAddress: prev?.startAddress || '',
                        startLat: prev?.startLat || 0,
                        startLng: prev?.startLng || 0
                    } as RouteData));
                    setGeocodingEnd(false);
                } else {
                    setError('Не удалось найти адрес прибытия');
                    setGeocodingEnd(false);
                }
            }).catch((err: any) => {
                console.error('Yandex geocoding error:', err);
                setError('Ошибка при поиске адреса прибытия');
                setGeocodingEnd(false);
            });
        }, 800);
    };

    const updateRouteOnMap = () => {
        if (!mapInstanceRef.current || !window.ymaps || !routeData) return;

        // Очищаем предыдущие метки и маршрут
        if (startPlacemarkRef.current) {
            mapInstanceRef.current.geoObjects.remove(startPlacemarkRef.current);
            startPlacemarkRef.current = null;
        }
        if (endPlacemarkRef.current) {
            mapInstanceRef.current.geoObjects.remove(endPlacemarkRef.current);
            endPlacemarkRef.current = null;
        }
        if (routePolylineRef.current) {
            mapInstanceRef.current.geoObjects.remove(routePolylineRef.current);
            routePolylineRef.current = null;
        }

        const hasStart = routeData.startLat && routeData.startLng && routeData.startLat !== 0 && routeData.startLng !== 0;
        const hasEnd = routeData.endLat && routeData.endLng && routeData.endLat !== 0 && routeData.endLng !== 0;

        // Добавляем метку отправления
        if (hasStart) {
            const startCoords: [number, number] = [routeData.startLat, routeData.startLng];
            const startPlacemark = new window.ymaps.Placemark(startCoords, {
                iconContent: 'A',
                balloonContent: `Отправление: ${routeData.startAddress || ''}`
            }, {
                preset: 'islands#greenCircleDotIconWithCaption'
            });
            mapInstanceRef.current.geoObjects.add(startPlacemark);
            startPlacemarkRef.current = startPlacemark;
        }

        // Добавляем метку прибытия
        if (hasEnd) {
            const endCoords: [number, number] = [routeData.endLat, routeData.endLng];
            const endPlacemark = new window.ymaps.Placemark(endCoords, {
                iconContent: 'B',
                balloonContent: `Прибытие: ${routeData.endAddress || ''}`
            }, {
                preset: 'islands#redCircleDotIconWithCaption'
            });
            mapInstanceRef.current.geoObjects.add(endPlacemark);
            endPlacemarkRef.current = endPlacemark;
        }

        // Строим маршрут между точками
        if (hasStart && hasEnd) {
            const startCoords: [number, number] = [routeData.startLat, routeData.startLng];
            const endCoords: [number, number] = [routeData.endLat, routeData.endLng];
            
            window.ymaps.route([startCoords, endCoords]).then((route: any) => {
                // Удаляем старую линию, если есть
                if (routePolylineRef.current) {
                    mapInstanceRef.current.geoObjects.remove(routePolylineRef.current);
                    routePolylineRef.current = null;
                }

                // Добавляем маршрут на карту (Yandex Maps сам отрисует линию)
                mapInstanceRef.current.geoObjects.add(route);
                routePolylineRef.current = route;

                // Получаем расстояние и время
                const distance = route.getLength(); // в метрах
                const time = route.getJamsTime(); // в секундах

                // Обновляем routeData с расстоянием и временем
                setRouteData(prev => prev ? {
                    ...prev,
                    distance: distance,
                    time: time
                } : null);

                // Масштабируем карту с небольшим отступом (не слишком сильно)
                const bounds = route.getWayPoints().getBounds();
                if (bounds) {
                    mapInstanceRef.current.setBounds(bounds, {
                        checkZoomRange: true,
                        zoomMargin: 50 // Небольшой отступ
                    });
                }
            }).catch((err: any) => {
                console.error('Ошибка построения маршрута:', err);
                // Если не удалось построить маршрут, просто показываем обе точки
                const startCoords: [number, number] = [routeData.startLat, routeData.startLng];
                const endCoords: [number, number] = [routeData.endLat, routeData.endLng];
                mapInstanceRef.current.setBounds([startCoords, endCoords], {
                    checkZoomRange: true,
                    zoomMargin: 50
                });
            });
        } else if (hasStart) {
            // Если только одна точка, центрируем на ней
            const startCoords: [number, number] = [routeData.startLat, routeData.startLng];
            mapInstanceRef.current.setCenter(startCoords, 15);
        } else if (hasEnd) {
            // Если только одна точка, центрируем на ней
            const endCoords: [number, number] = [routeData.endLat, routeData.endLng];
            mapInstanceRef.current.setCenter(endCoords, 15);
        }
    };

    const sendRoute = async () => {
        if (!routeData || !routeData.startAddress || !routeData.endAddress) {
            setError('Укажите точки отправления и прибытия');
            return;
        }

        // Если расстояние и время еще не рассчитаны, рассчитываем их
        let finalRouteData = routeData;
        if (!routeData.distance || !routeData.time) {
            const startCoords: [number, number] = [routeData.startLat, routeData.startLng];
            const endCoords: [number, number] = [routeData.endLat, routeData.endLng];
            
            try {
                const route = await window.ymaps.route([startCoords, endCoords]);
                const distance = route.getLength();
                const time = route.getJamsTime();
                
                finalRouteData = {
                    ...routeData,
                    distance: distance,
                    time: time
                };
                
                setRouteData(finalRouteData);
            } catch (err) {
                console.error('Ошибка расчета маршрута:', err);
            }
        }

        try {
            setSendingRoute(true);
            // Отправляем маршрут с расстоянием и временем в JSON через обычный endpoint сообщений
            const routeJson = JSON.stringify({
                startAddress: finalRouteData.startAddress,
                endAddress: finalRouteData.endAddress,
                startLat: finalRouteData.startLat,
                startLng: finalRouteData.startLng,
                endLat: finalRouteData.endLat,
                endLng: finalRouteData.endLng,
                distance: finalRouteData.distance,
                time: finalRouteData.time
            });
            
            await api.post('/api/messages', {
                requestId,
                text: routeJson,
                type: 'ROUTE'
            });
            setShowRouteBuilder(false);
            setRouteData(null);
            setStartAddressInput('');
            setEndAddressInput('');
            fetchMessages();
        } catch (err: any) {
            console.error('Ошибка отправки маршрута:', err);
            setError('Ошибка отправки маршрута');
        } finally {
            setSendingRoute(false);
        }
    };

    const confirmRoute = async (messageId: number) => {
        try {
            await api.post(`/api/messages/route/${messageId}/confirm`);
            fetchMessages();
        } catch (err: any) {
            console.error('Ошибка подтверждения маршрута:', err);
            setError('Ошибка подтверждения маршрута');
        }
    };

    const parseRouteData = (text: string): RouteData | null => {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                        Загрузка чата...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>💬 Чат по заявке #{requestId}</h2>
                    <button onClick={onClose} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                        ✕ Закрыть
                    </button>
                </div>

                {error && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                {!isOwner && !showRouteBuilder && (
                    <button 
                        onClick={() => setShowRouteBuilder(true)}
                        style={{ 
                            marginBottom: '16px', 
                            padding: '10px 20px', 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🗺️ Предложить маршрут
                    </button>
                )}

                {showRouteBuilder && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <h3 style={{ marginTop: 0 }}>🗺️ Построение маршрута</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                            Введите адреса отправления и прибытия. Маршрут будет построен автоматически.
                        </p>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                📍 Адрес отправления:
                            </label>
                            <input
                                type="text"
                                value={startAddressInput}
                                onChange={(e) => handleStartAddressChange(e.target.value)}
                                placeholder="Например: Минск, ул. Ленина, 1"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                            {geocodingStart && (
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Поиск адреса...</p>
                            )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                📍 Адрес прибытия:
                            </label>
                            <input
                                type="text"
                                value={endAddressInput}
                                onChange={(e) => handleEndAddressChange(e.target.value)}
                                placeholder="Например: Минск, ул. Пушкина, 10"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                            {geocodingEnd && (
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Поиск адреса...</p>
                            )}
                        </div>

                        {routeData && (routeData.startAddress || routeData.endAddress) && (
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '4px' }}>
                                {routeData.startAddress && (
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>📍 От:</strong> {routeData.startAddress}
                                    </p>
                                )}
                                {routeData.endAddress && (
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>📍 До:</strong> {routeData.endAddress}
                                    </p>
                                )}
                                {routeData.distance && (
                                    <p style={{ margin: '8px 0 4px 0', paddingTop: '8px', borderTop: '1px solid #eee', fontSize: '14px' }}>
                                        <strong>📏 Расстояние:</strong> {
                                            routeData.distance >= 1000 
                                                ? `${(routeData.distance / 1000).toFixed(2)} км`
                                                : `${Math.round(routeData.distance)} м`
                                        }
                                    </p>
                                )}
                                {routeData.time && (
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>⏱️ Время в пути:</strong> {
                                            routeData.time >= 3600
                                                ? `${Math.floor(routeData.time / 3600)} ч ${Math.floor((routeData.time % 3600) / 60)} мин`
                                                : `${Math.floor(routeData.time / 60)} мин`
                                        }
                                    </p>
                                )}
                            </div>
                        )}

                        <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #ddd' }} />
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={sendRoute}
                                disabled={!routeData || !routeData.startAddress || !routeData.endAddress || sendingRoute}
                                style={{ 
                                    padding: '10px 20px', 
                                    background: routeData && routeData.startAddress && routeData.endAddress ? '#28a745' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: routeData && routeData.startAddress && routeData.endAddress ? 'pointer' : 'not-allowed',
                                    opacity: routeData && routeData.startAddress && routeData.endAddress ? 1 : 0.6,
                                    fontWeight: 'bold'
                                }}
                            >
                                {sendingRoute ? 'Отправка...' : '✓ Отправить маршрут'}
                            </button>
                            <button 
                                onClick={() => {
                                    setShowRouteBuilder(false);
                                    setRouteData(null);
                                    setStartAddressInput('');
                                    setEndAddressInput('');
                                    setGeocodingStart(false);
                                    setGeocodingEnd(false);
                                    if (geocodeTimeoutRef.current) {
                                        clearTimeout(geocodeTimeoutRef.current);
                                        geocodeTimeoutRef.current = null;
                                    }
                                    // Очищаем карту
                                    if (mapInstanceRef.current && window.ymaps) {
                                        mapInstanceRef.current.geoObjects.removeAll();
                                        startPlacemarkRef.current = null;
                                        endPlacemarkRef.current = null;
                                        routePolylineRef.current = null;
                                    }
                                }}
                                style={{ 
                                    padding: '10px 20px', 
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                    {messages.map((message) => {
                        const isMyMessage = message.senderId === currentUserId;
                        const routeData = message.type === 'ROUTE' ? parseRouteData(message.text) : null;

                        return (
                            <div
                                key={message.id}
                                style={{
                                    marginBottom: '16px',
                                    display: 'flex',
                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '70%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: isMyMessage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ffffff',
                                        color: isMyMessage ? 'white' : '#333',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {!isMyMessage && (
                                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                                            {message.senderName}
                                        </div>
                                    )}
                                    {message.type === 'ROUTE' && routeData ? (
                                        <div>
                                            <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                                                🗺️ Предложен маршрут:
                                            </div>
                                            <div style={{ fontSize: '14px', marginBottom: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                                                <p style={{ margin: '4px 0' }}>
                                                    <strong>📍 От:</strong> {routeData.startAddress}
                                                </p>
                                                <p style={{ margin: '4px 0' }}>
                                                    <strong>📍 До:</strong> {routeData.endAddress}
                                                </p>
                                                {routeData.distance && (
                                                    <p style={{ margin: '8px 0 4px 0', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                                        <strong>📏 Расстояние:</strong> {
                                                            routeData.distance >= 1000 
                                                                ? `${(routeData.distance / 1000).toFixed(2)} км`
                                                                : `${Math.round(routeData.distance)} м`
                                                        }
                                                    </p>
                                                )}
                                                {routeData.time && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>⏱️ Время в пути:</strong> {
                                                            routeData.time >= 3600
                                                                ? `${Math.floor(routeData.time / 3600)} ч ${Math.floor((routeData.time % 3600) / 60)} мин`
                                                                : `${Math.floor(routeData.time / 60)} мин`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                                                <RouteMapView
                                                    startLat={routeData.startLat}
                                                    startLng={routeData.startLng}
                                                    endLat={routeData.endLat}
                                                    endLng={routeData.endLng}
                                                    startAddress={routeData.startAddress}
                                                    endAddress={routeData.endAddress}
                                                    height="300px"
                                                />
                                            </div>
                                            {isOwner && (
                                                <button
                                                    onClick={() => confirmRoute(message.id)}
                                                    style={{
                                                        padding: '10px 20px',
                                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                                                    }}
                                                >
                                                    ✓ Подтвердить маршрут
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div>{message.text}</div>
                                    )}
                                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                                        {new Date(message.createdAt).toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Введите сообщение..."
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                            opacity: newMessage.trim() ? 1 : 0.6
                        }}
                    >
                        Отправить
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RequestChat;

