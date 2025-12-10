import React, { useEffect, useRef } from 'react';
import { loadYandexMaps } from '../utils/yandexMapsLoader';

interface RouteMapViewProps {
    startLat?: number | string;
    startLng?: number | string;
    endLat?: number | string;
    endLng?: number | string;
    startAddress?: string;
    endAddress?: string;
    height?: string;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const RouteMapView: React.FC<RouteMapViewProps> = ({ 
    startLat, 
    startLng, 
    endLat, 
    endLng, 
    startAddress, 
    endAddress,
    height = '400px' 
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const startPlacemarkRef = useRef<any>(null);
    const endPlacemarkRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = async () => {
            try {
                // Загружаем Яндекс Карты API 2.1
                const ymaps = await loadYandexMaps();
                if (!ymaps) return;

                // Если карта уже создана, только обновляем метки
                if (mapInstanceRef.current) {
                    updateMarkers();
                    return;
                }

                // Создаем карту только один раз
                const map = new window.ymaps.Map(mapRef.current, {
                    center: [53.9, 27.5667],
                    zoom: 10,
                    controls: ['zoomControl', 'fullscreenControl', 'routeButtonControl']
                });

                mapInstanceRef.current = map;
                updateMarkers();
            } catch (error) {
                console.error('Failed to load Yandex Maps:', error);
            }
        };

        const updateMarkers = () => {
            if (!mapInstanceRef.current || !window.ymaps) return;

            const startLatNum = startLat ? (typeof startLat === 'string' ? parseFloat(startLat) : startLat) : null;
            const startLngNum = startLng ? (typeof startLng === 'string' ? parseFloat(startLng) : startLng) : null;
            const endLatNum = endLat ? (typeof endLat === 'string' ? parseFloat(endLat) : endLat) : null;
            const endLngNum = endLng ? (typeof endLng === 'string' ? parseFloat(endLng) : endLng) : null;

            // Удаляем старые метки
            if (startPlacemarkRef.current) {
                mapInstanceRef.current.geoObjects.remove(startPlacemarkRef.current);
                startPlacemarkRef.current = null;
            }
            if (endPlacemarkRef.current) {
                mapInstanceRef.current.geoObjects.remove(endPlacemarkRef.current);
                endPlacemarkRef.current = null;
            }

            const updateStartMarker = (coords: [number, number]) => {
                const placemark = new window.ymaps.Placemark(coords, {
                    balloonContent: startAddress || 'Точка отправления'
                });
                mapInstanceRef.current.geoObjects.add(placemark);
                startPlacemarkRef.current = placemark;
                return coords;
            };

            const updateEndMarker = (coords: [number, number]) => {
                const placemark = new window.ymaps.Placemark(coords, {
                    balloonContent: endAddress || 'Точка назначения'
                });
                mapInstanceRef.current.geoObjects.add(placemark);
                endPlacemarkRef.current = placemark;
                return coords;
            };

            // Обрабатываем начальную точку
            let startCoords: [number, number] | null = null;
            if (startLatNum && startLngNum && !isNaN(startLatNum) && !isNaN(startLngNum)) {
                startCoords = [startLatNum, startLngNum];
                updateStartMarker(startCoords);
            } else if (startAddress && startAddress.trim().length > 0) {
                window.ymaps.geocode(startAddress, { results: 1 }).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const coords = firstGeoObject.geometry.getCoordinates();
                        if (coords[0] >= 51.0 && coords[0] <= 56.0 && coords[1] >= 23.0 && coords[1] <= 33.0) {
                            updateStartMarker(coords);
                        }
                    }
                }).catch(() => {});
            }

            // Обрабатываем конечную точку
            let endCoords: [number, number] | null = null;
            if (endLatNum && endLngNum && !isNaN(endLatNum) && !isNaN(endLngNum)) {
                endCoords = [endLatNum, endLngNum];
                updateEndMarker(endCoords);
            } else if (endAddress && endAddress.trim().length > 0) {
                window.ymaps.geocode(endAddress, { results: 1 }).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const coords = firstGeoObject.geometry.getCoordinates();
                        if (coords[0] >= 51.0 && coords[0] <= 56.0 && coords[1] >= 23.0 && coords[1] <= 33.0) {
                            updateEndMarker(coords);
                        }
                    }
                }).catch(() => {});
            }

            // Если есть обе точки, строим маршрут
            if (startPlacemarkRef.current && endPlacemarkRef.current) {
                const start = startPlacemarkRef.current.geometry.getCoordinates();
                const end = endPlacemarkRef.current.geometry.getCoordinates();
                window.ymaps.route([start, end]).then((route: any) => {
                    mapInstanceRef.current.geoObjects.add(route);
                    mapInstanceRef.current.setBounds(route.getWayPoints().getBounds());
                }).catch(() => {
                    mapInstanceRef.current.setBounds([start, end]);
                });
            } else if (startPlacemarkRef.current) {
                const coords = startPlacemarkRef.current.geometry.getCoordinates();
                mapInstanceRef.current.setCenter(coords, 15);
            } else if (endPlacemarkRef.current) {
                const coords = endPlacemarkRef.current.geometry.getCoordinates();
                mapInstanceRef.current.setCenter(coords, 15);
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
                startPlacemarkRef.current = null;
                endPlacemarkRef.current = null;
            }
        };
    }, [startLat, startLng, endLat, endLng, startAddress, endAddress, height]);

    const startLatNum = startLat ? (typeof startLat === 'string' ? parseFloat(startLat) : startLat) : null;
    const startLngNum = startLng ? (typeof startLng === 'string' ? parseFloat(startLng) : startLng) : null;
    const endLatNum = endLat ? (typeof endLat === 'string' ? parseFloat(endLat) : endLat) : null;
    const endLngNum = endLng ? (typeof endLng === 'string' ? parseFloat(endLng) : endLng) : null;

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height, margin: '20px 0' }} />
            {startAddress && (
                <p style={{ marginTop: '10px' }}>
                    <strong>От:</strong> {startAddress}
                    {startLatNum && startLngNum && !isNaN(startLatNum) && !isNaN(startLngNum) && (
                        ` (${startLatNum.toFixed(7)}, ${startLngNum.toFixed(7)})`
                    )}
                </p>
            )}
            {endAddress && (
                <p style={{ marginTop: '5px' }}>
                    <strong>До:</strong> {endAddress}
                    {endLatNum && endLngNum && !isNaN(endLatNum) && !isNaN(endLngNum) && (
                        ` (${endLatNum.toFixed(7)}, ${endLngNum.toFixed(7)})`
                    )}
                </p>
            )}
        </div>
    );
};

export default RouteMapView;

