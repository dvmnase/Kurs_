import React, { useEffect, useRef } from 'react';
import { loadYandexMaps } from '../utils/yandexMapsLoader';

interface MapViewProps {
    latitude?: number | string;
    longitude?: number | string;
    address?: string;
    height?: string;
    onCoordinatesChange?: (lat: number, lng: number) => void;
    onAddressChange?: (address: string) => void;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const MapView: React.FC<MapViewProps> = ({ latitude, longitude, address, height = '400px', onCoordinatesChange, onAddressChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const placemarkRef = useRef<any>(null);
    const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = async () => {
            try {
                // Загружаем Яндекс Карты API 2.1
                const ymaps = await loadYandexMaps();
                if (!ymaps) return;

                // Если карта уже создана, только обновляем метку
                if (mapInstanceRef.current) {
                    updateMarker();
                    return;
                }

                // Создаем карту только один раз
                const latNum = latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null;
                const lngNum = longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null;

                let center: [number, number] = [53.9, 27.5667]; // Минск по умолчанию
                let zoom = 10;

                if (latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum)) {
                    center = [latNum, lngNum];
                    zoom = 15;
                }

                // Создаем карту
                const map = new window.ymaps.Map(mapRef.current, {
                    center: center,
                    zoom: zoom,
                    controls: ['zoomControl', 'fullscreenControl']
                });

                // Добавляем обработчик клика на карту
                map.events.add('click', (e: any) => {
                    const coords = e.get('coords');
                    if (coords) {
                        if (onCoordinatesChange) {
                            onCoordinatesChange(coords[0], coords[1]);
                        }
                        // Выполняем обратный геокодинг для получения адреса
                        if (onAddressChange) {
                            window.ymaps.geocode(coords).then((res: any) => {
                                const firstGeoObject = res.geoObjects.get(0);
                                if (firstGeoObject) {
                                    const addressText = firstGeoObject.getAddressLine();
                                    if (addressText) {
                                        onAddressChange(addressText);
                                    }
                                }
                            }).catch((err: any) => {
                                console.error('Reverse geocoding error:', err);
                            });
                        }
                    }
                });

                mapInstanceRef.current = map;
                
                // Создаем метку
                updateMarker();
            } catch (error) {
                console.error('Failed to load Yandex Maps:', error);
            }
        };

        const updateMarker = () => {
            if (!mapInstanceRef.current || !window.ymaps) return;

            const latNum = latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null;
            const lngNum = longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null;

            // Если есть координаты, используем их
            if (latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum)) {
                const center: [number, number] = [latNum, lngNum];
                
                // Удаляем старую метку
                if (placemarkRef.current) {
                    mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
                }

                // Создаем новую метку
                const placemark = new window.ymaps.Placemark(center, {
                    balloonContent: address || `${center[0]}, ${center[1]}`,
                    draggable: true
                });

                // Добавляем обработчик перетаскивания метки
                placemark.events.add('dragend', () => {
                    const coords = placemark.geometry.getCoordinates();
                    if (coords) {
                        if (onCoordinatesChange) {
                            onCoordinatesChange(coords[0], coords[1]);
                        }
                        // Выполняем обратный геокодинг для получения адреса
                        if (onAddressChange) {
                            window.ymaps.geocode(coords).then((res: any) => {
                                const firstGeoObject = res.geoObjects.get(0);
                                if (firstGeoObject) {
                                    const addressText = firstGeoObject.getAddressLine();
                                    if (addressText) {
                                        onAddressChange(addressText);
                                    }
                                }
                            }).catch((err: any) => {
                                console.error('Reverse geocoding error:', err);
                            });
                        }
                    }
                });

                // Добавляем обработчик клика на метку
                placemark.events.add('click', () => {
                    const coords = placemark.geometry.getCoordinates();
                    if (coords) {
                        if (onCoordinatesChange) {
                            onCoordinatesChange(coords[0], coords[1]);
                        }
                        // Выполняем обратный геокодинг для получения адреса
                        if (onAddressChange) {
                            window.ymaps.geocode(coords).then((res: any) => {
                                const firstGeoObject = res.geoObjects.get(0);
                                if (firstGeoObject) {
                                    const addressText = firstGeoObject.getAddressLine();
                                    if (addressText) {
                                        onAddressChange(addressText);
                                    }
                                }
                            }).catch((err: any) => {
                                console.error('Reverse geocoding error:', err);
                            });
                        }
                    }
                });

                mapInstanceRef.current.geoObjects.add(placemark);
                mapInstanceRef.current.setCenter(center, 15);
                placemarkRef.current = placemark;
            } 
            // Если есть адрес, но нет координат - геокодируем через Yandex Maps API с debounce
            else if (address && address.trim().length > 3) {
                // Очищаем предыдущий таймаут
                if (geocodeTimeoutRef.current) {
                    clearTimeout(geocodeTimeoutRef.current);
                }
                
                // Debounce для геокодинга адреса (800мс после окончания ввода)
                geocodeTimeoutRef.current = setTimeout(() => {
                    window.ymaps.geocode(address, {
                        results: 1
                    }).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const coords = firstGeoObject.geometry.getCoordinates();
                        
                        // Удаляем старую метку
                        if (placemarkRef.current) {
                            mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
                        }

                        // Получаем адрес из результата геокодинга
                        const foundAddress = firstGeoObject.getAddressLine();

                        // Создаем новую метку
                        const placemark = new window.ymaps.Placemark(coords, {
                            balloonContent: foundAddress || address,
                            draggable: true
                        });

                        // Добавляем обработчик перетаскивания метки
                        placemark.events.add('dragend', () => {
                            const coords = placemark.geometry.getCoordinates();
                            if (coords) {
                                if (onCoordinatesChange) {
                                    onCoordinatesChange(coords[0], coords[1]);
                                }
                                // Выполняем обратный геокодинг для получения адреса
                                if (onAddressChange) {
                                    window.ymaps.geocode(coords).then((res: any) => {
                                        const firstGeoObject = res.geoObjects.get(0);
                                        if (firstGeoObject) {
                                            const addressText = firstGeoObject.getAddressLine();
                                            if (addressText) {
                                                onAddressChange(addressText);
                                            }
                                        }
                                    }).catch((err: any) => {
                                        console.error('Reverse geocoding error:', err);
                                    });
                                }
                            }
                        });

                        // Добавляем обработчик клика на метку
                        placemark.events.add('click', () => {
                            const coords = placemark.geometry.getCoordinates();
                            if (coords) {
                                if (onCoordinatesChange) {
                                    onCoordinatesChange(coords[0], coords[1]);
                                }
                                // Выполняем обратный геокодинг для получения адреса
                                if (onAddressChange) {
                                    window.ymaps.geocode(coords).then((res: any) => {
                                        const firstGeoObject = res.geoObjects.get(0);
                                        if (firstGeoObject) {
                                            const addressText = firstGeoObject.getAddressLine();
                                            if (addressText) {
                                                onAddressChange(addressText);
                                            }
                                        }
                                    }).catch((err: any) => {
                                        console.error('Reverse geocoding error:', err);
                                    });
                                }
                            }
                        });

                        mapInstanceRef.current.geoObjects.add(placemark);
                        mapInstanceRef.current.setCenter(coords, 15);
                        placemarkRef.current = placemark;
                        
                        // Вызываем callback с координатами (только координаты, адрес не меняем)
                        if (onCoordinatesChange) {
                            onCoordinatesChange(coords[0], coords[1]);
                        }
                    }
                    }).catch((err: any) => {
                        console.error('Yandex geocoding error:', err);
                    });
                }, 800);
            }
        };

        initMap();

        return () => {
            // Очищаем таймаут при размонтировании
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
                geocodeTimeoutRef.current = null;
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
                placemarkRef.current = null;
            }
        };
    }, [latitude, longitude, address, height]);

    const latNum = latitude ? (typeof latitude === 'string' ? parseFloat(latitude) : latitude) : null;
    const lngNum = longitude ? (typeof longitude === 'string' ? parseFloat(longitude) : longitude) : null;

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height, margin: '20px 0' }} />
            {address && (
                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                    <strong>Адрес:</strong> {address}
                </p>
            )}
            {latNum && lngNum && !isNaN(latNum) && !isNaN(lngNum) && (
                <p style={{ marginTop: '5px', color: '#666' }}>
                    <strong>Координаты:</strong> {latNum.toFixed(7)}, {lngNum.toFixed(7)}
                </p>
            )}
        </div>
    );
};

export default MapView;




