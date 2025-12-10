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
    isEmbedded?: boolean;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const RequestChat: React.FC<RequestChatProps> = ({ requestId, currentUserId, isOwner, onClose, isEmbedded = false }) => {
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
    const messagesContainerRef = useRef<HTMLDivElement>(null);
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

    const prevMessagesLengthRef = useRef<number>(0);
    const isInitialLoadRef = useRef<boolean>(true);
    
    useEffect(() => {
        // При первой загрузке не прокручиваем
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
        }
        
        // Прокручиваем только если появилось новое сообщение
        if (messages.length > prevMessagesLengthRef.current && messagesContainerRef.current) {
            setTimeout(() => {
                scrollToBottom();
            }, 100);
            prevMessagesLengthRef.current = messages.length;
        }
    }, [messages]);
    
    // Сбрасываем флаг при смене requestId
    useEffect(() => {
        isInitialLoadRef.current = true;
        prevMessagesLengthRef.current = 0;
    }, [requestId]);

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
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
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
            setError(null);
            // Показываем уведомление об успешном подтверждении
            const successMessage = 'Маршрут успешно подтвержден!';
            setError(successMessage);
            // Убираем сообщение об ошибке через 3 секунды
            setTimeout(() => {
                setError(null);
            }, 3000);
            fetchMessages();
            // Закрываем чат после подтверждения
            setTimeout(() => {
                onClose();
            }, 2000);
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
        if (isEmbedded) {
            return (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '16px' }}>Загрузка...</div>
                        Загрузка чата...
                    </div>
                </div>
            );
        }
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ marginBottom: '16px' }}>Загрузка...</div>
                        Загрузка чата...
                    </div>
                </div>
            </div>
        );
    }

    const chatContent = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: isEmbedded ? '20px' : '0' }}>
            {!isEmbedded && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Чат по заявке #{requestId}</h2>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            fontSize: '24px', 
                            cursor: 'pointer',
                            color: '#333',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1'
                        }}
                    >
                                        ×
                    </button>
                </div>
            )}
            
            {isEmbedded && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>Чат по заявке #{requestId}</h2>
                </div>
            )}

                {error && (
                    <div style={{ 
                        background: error.includes('успешно') ? 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)' : '#f8d7da', 
                        color: error.includes('успешно') ? '#1b5e20' : '#721c24', 
                        padding: '12px', 
                        borderRadius: '4px', 
                        marginBottom: '16px',
                        border: error.includes('успешно') ? '2px solid #4caf50' : '1px solid #f5c6cb',
                        boxShadow: error.includes('успешно') ? '0 2px 8px rgba(76, 175, 80, 0.2)' : 'none',
                        fontWeight: error.includes('успешно') ? '600' : 'normal'
                    }}>
                        {error}
                    </div>
                )}

                {!isOwner && !showRouteBuilder && (
                    <button 
                        onClick={() => setShowRouteBuilder(true)}
                        style={{ 
                            marginBottom: '16px', 
                            padding: '10px 20px', 
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Предложить маршрут
                    </button>
                )}

                {showRouteBuilder && (
                    <>
                        <div 
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 1000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
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
                                    if (mapInstanceRef.current && window.ymaps) {
                                        mapInstanceRef.current.geoObjects.removeAll();
                                        startPlacemarkRef.current = null;
                                        endPlacemarkRef.current = null;
                                        routePolylineRef.current = null;
                                    }
                                }
                            }}
                        >
                            <div 
                                style={{ 
                                    position: 'relative',
                                    padding: '20px', 
                                    background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', 
                                    borderRadius: '16px', 
                                    width: '90%',
                                    maxWidth: '700px',
                                    maxHeight: '90vh',
                                    border: '2px solid #c8e6c9',
                                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
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
                                        if (mapInstanceRef.current && window.ymaps) {
                                            mapInstanceRef.current.geoObjects.removeAll();
                                            startPlacemarkRef.current = null;
                                            endPlacemarkRef.current = null;
                                            routePolylineRef.current = null;
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '28px',
                                        cursor: 'pointer',
                                        color: '#2e7d32',
                                        padding: '0',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1',
                                        zIndex: 1001
                                    }}
                                >
                                    ×
                                </button>
                                
                                <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '22px', color: '#2e7d32', fontWeight: 'bold', paddingRight: '40px' }}>Построение маршрута</h3>
                                <p style={{ fontSize: '13px', color: '#388e3c', marginBottom: '12px' }}>
                                    Введите адреса отправления и прибытия.
                                </p>
                                
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '13px', color: '#2e7d32' }}>
                                        Адрес отправления:
                                    </label>
                                    <input
                                        type="text"
                                        value={startAddressInput}
                                        onChange={(e) => handleStartAddressChange(e.target.value)}
                                        placeholder="Например: Минск, ул. Ленина, 1"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '2px solid #c8e6c9',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            background: '#ffffff',
                                            color: '#1b5e20',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 4px rgba(76, 175, 80, 0.08)',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#4caf50';
                                            e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.2)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#c8e6c9';
                                            e.target.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.08)';
                                        }}
                                    />
                                    {geocodingStart && (
                                        <p style={{ fontSize: '11px', color: '#388e3c', marginTop: '3px', fontStyle: 'italic' }}>Поиск адреса...</p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '13px', color: '#2e7d32' }}>
                                        Адрес прибытия:
                                    </label>
                                    <input
                                        type="text"
                                        value={endAddressInput}
                                        onChange={(e) => handleEndAddressChange(e.target.value)}
                                        placeholder="Например: Минск, ул. Пушкина, 10"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '2px solid #c8e6c9',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            background: '#ffffff',
                                            color: '#1b5e20',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 4px rgba(76, 175, 80, 0.08)',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#4caf50';
                                            e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.2)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#c8e6c9';
                                            e.target.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.08)';
                                        }}
                                    />
                                    {geocodingEnd && (
                                        <p style={{ fontSize: '11px', color: '#388e3c', marginTop: '3px', fontStyle: 'italic' }}>Поиск адреса...</p>
                                    )}
                                </div>

                                {routeData && (routeData.distance || routeData.time) && (
                                    <div style={{ 
                                        marginBottom: '10px', 
                                        padding: '10px', 
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f1f8f4 100%)', 
                                        borderRadius: '8px',
                                        border: '2px solid #a5d6a7',
                                        boxShadow: '0 2px 6px rgba(76, 175, 80, 0.1)'
                                    }}>
                                        {routeData.distance && (
                                            <p style={{ margin: '3px 0', fontSize: '13px', color: '#1b5e20' }}>
                                                <strong style={{ color: '#2e7d32' }}>Расстояние:</strong> {
                                                    routeData.distance >= 1000 
                                                        ? `${(routeData.distance / 1000).toFixed(2)} км`
                                                        : `${Math.round(routeData.distance)} м`
                                                }
                                            </p>
                                        )}
                                        {routeData.time && (
                                            <p style={{ margin: '3px 0', fontSize: '13px', color: '#1b5e20' }}>
                                                <strong style={{ color: '#2e7d32' }}>Время в пути:</strong> {
                                                    routeData.time >= 3600
                                                        ? `${Math.floor(routeData.time / 3600)} ч ${Math.floor((routeData.time % 3600) / 60)} мин`
                                                        : `${Math.floor(routeData.time / 60)} мин`
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div ref={mapRef} style={{ 
                                    width: '100%', 
                                    height: '280px', 
                                    borderRadius: '10px', 
                                    marginBottom: '10px', 
                                    border: '2px solid #a5d6a7',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)',
                                    flexShrink: 0
                                }} />
                                
                                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                    <button 
                                        onClick={sendRoute}
                                        disabled={!routeData || !routeData.startAddress || !routeData.endAddress || sendingRoute}
                                        style={{ 
                                            flex: 1,
                                            padding: '10px 18px', 
                                            background: routeData && routeData.startAddress && routeData.endAddress 
                                                ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' 
                                                : '#c8e6c9',
                                            color: routeData && routeData.startAddress && routeData.endAddress ? 'white' : '#81c784',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: routeData && routeData.startAddress && routeData.endAddress ? 'pointer' : 'not-allowed',
                                            opacity: routeData && routeData.startAddress && routeData.endAddress ? 1 : 0.7,
                                            fontWeight: 'bold',
                                            fontSize: '13px',
                                            boxShadow: routeData && routeData.startAddress && routeData.endAddress 
                                                ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                                                : 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (routeData && routeData.startAddress && routeData.endAddress) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (routeData && routeData.startAddress && routeData.endAddress) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                                            }
                                        }}
                                    >
                                        {sendingRoute ? 'Отправка...' : 'Отправить маршрут'}
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
                                            if (mapInstanceRef.current && window.ymaps) {
                                                mapInstanceRef.current.geoObjects.removeAll();
                                                startPlacemarkRef.current = null;
                                                endPlacemarkRef.current = null;
                                                routePolylineRef.current = null;
                                            }
                                        }}
                                        style={{ 
                                            padding: '10px 18px', 
                                            background: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(129, 199, 132, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 199, 132, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(129, 199, 132, 0.3)';
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
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
                                        maxWidth: message.type === 'ROUTE' ? '80%' : '70%',
                                        width: message.type === 'ROUTE' ? '98%' : 'auto',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: isMyMessage ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' : '#ffffff',
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
                                                Предложен маршрут:
                                            </div>
                                            <div style={{ fontSize: '14px', marginBottom: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                                                {routeData.startAddress && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>От:</strong> {routeData.startAddress}
                                                    </p>
                                                )}
                                                {routeData.endAddress && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>До:</strong> {routeData.endAddress}
                                                    </p>
                                                )}
                                                {(routeData.distance || routeData.time) && (
                                                    <>
                                                        {routeData.startAddress || routeData.endAddress ? (
                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                                                {routeData.distance && (
                                                                    <p style={{ margin: '4px 0' }}>
                                                                        <strong>Расстояние:</strong> {
                                                                            routeData.distance >= 1000 
                                                                                ? `${(routeData.distance / 1000).toFixed(2)} км`
                                                                                : `${Math.round(routeData.distance)} м`
                                                                        }
                                                                    </p>
                                                                )}
                                                                {routeData.time && (
                                                                    <p style={{ margin: '4px 0' }}>
                                                                        <strong>Время в пути:</strong> {
                                                                            routeData.time >= 3600
                                                                                ? `${Math.floor(routeData.time / 3600)} ч ${Math.floor((routeData.time % 3600) / 60)} мин`
                                                                                : `${Math.floor(routeData.time / 60)} мин`
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {routeData.distance && (
                                                                    <p style={{ margin: '4px 0' }}>
                                                                        <strong>Расстояние:</strong> {
                                                                            routeData.distance >= 1000 
                                                                                ? `${(routeData.distance / 1000).toFixed(2)} км`
                                                                                : `${Math.round(routeData.distance)} м`
                                                                        }
                                                                    </p>
                                                                )}
                                                                {routeData.time && (
                                                                    <p style={{ margin: '4px 0' }}>
                                                                        <strong>Время в пути:</strong> {
                                                                            routeData.time >= 3600
                                                                                ? `${Math.floor(routeData.time / 3600)} ч ${Math.floor((routeData.time % 3600) / 60)} мин`
                                                                                : `${Math.floor(routeData.time / 60)} мин`
                                                                        }
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', width: '100%' }}>
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
                                                        width: '100%',
                                                        padding: '12px 20px',
                                                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                                                    }}
                                                >
                                                    Подтвердить маршрут
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
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
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
    );

    if (isEmbedded) {
        return chatContent;
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                {chatContent}
            </div>
        </div>
    );
};

export default RequestChat;

