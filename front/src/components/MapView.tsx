import React, { useEffect, useRef } from 'react';
import { loadYandexMaps } from '../utils/yandexMapsLoader';

interface MapViewProps {
    latitude?: number | string;
    longitude?: number | string;
    address?: string;
    height?: string;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const MapView: React.FC<MapViewProps> = ({ latitude, longitude, address, height = '400px' }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const placemarkRef = useRef<any>(null);

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
                    balloonContent: address || `${center[0]}, ${center[1]}`
                });

                mapInstanceRef.current.geoObjects.add(placemark);
                mapInstanceRef.current.setCenter(center, 15);
                placemarkRef.current = placemark;
            } 
            // Если есть адрес, но нет координат - геокодируем через Yandex Maps API
            else if (address && address.trim().length > 0) {
                window.ymaps.geocode(address, {
                    results: 1
                }).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const coords = firstGeoObject.geometry.getCoordinates();
                        
                        // Проверяем, что координаты в Беларуси
                        if (coords[0] >= 51.0 && coords[0] <= 56.0 && 
                            coords[1] >= 23.0 && coords[1] <= 33.0) {
                            
                            // Удаляем старую метку
                            if (placemarkRef.current) {
                                mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
                            }

                            // Создаем новую метку
                            const placemark = new window.ymaps.Placemark(coords, {
                                balloonContent: address
                            });

                            mapInstanceRef.current.geoObjects.add(placemark);
                            mapInstanceRef.current.setCenter(coords, 15);
                            placemarkRef.current = placemark;
                        }
                    }
                }).catch((err: any) => {
                    console.error('Yandex geocoding error:', err);
                });
            }
        };

        initMap();

        return () => {
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




