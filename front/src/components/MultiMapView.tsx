import React, { useEffect, useRef } from 'react';
import { loadYandexMaps } from '../utils/yandexMapsLoader';

interface CargoLocation {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
}

interface MultiMapViewProps {
    cargos: CargoLocation[];
    height?: string;
}

declare global {
    interface Window {
        ymaps: any;
    }
}

const MultiMapView: React.FC<MultiMapViewProps> = ({ cargos, height = '600px' }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const placemarksRef = useRef<any[]>([]);

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

                // Определяем центр карты на основе всех грузов
                let center: [number, number] = [53.9, 27.5667]; // Минск по умолчанию
                let zoom = 10;

                if (cargos.length > 0) {
                    // Вычисляем средний центр всех грузов
                    const avgLat = cargos.reduce((sum, cargo) => sum + cargo.latitude, 0) / cargos.length;
                    const avgLng = cargos.reduce((sum, cargo) => sum + cargo.longitude, 0) / cargos.length;
                    center = [avgLat, avgLng];
                    
                    // Если один груз, увеличиваем зум
                    if (cargos.length === 1) {
                        zoom = 15;
                    } else {
                        // Для нескольких грузов подбираем зум так, чтобы все были видны
                        zoom = 12;
                    }
                }

                // Создаем карту
                const map = new window.ymaps.Map(mapRef.current, {
                    center: center,
                    zoom: zoom,
                    controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
                });

                mapInstanceRef.current = map;
                updateMarkers();
            } catch (error) {
                console.error('Failed to load Yandex Maps:', error);
            }
        };

        const updateMarkers = () => {
            if (!mapInstanceRef.current || !window.ymaps) return;

            // Удаляем все старые метки
            placemarksRef.current.forEach((placemark) => {
                mapInstanceRef.current.geoObjects.remove(placemark);
            });
            placemarksRef.current = [];

            // Создаем метки для каждого груза
            cargos.forEach((cargo, index) => {
                if (cargo.latitude && cargo.longitude && !isNaN(cargo.latitude) && !isNaN(cargo.longitude)) {
                    const coords: [number, number] = [cargo.latitude, cargo.longitude];
                    
                    // Создаем метку с номером
                    const placemark = new window.ymaps.Placemark(coords, {
                        balloonContent: `
                            <div style="padding: 10px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${cargo.name}</h3>
                                ${cargo.address ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">${cargo.address}</p>` : ''}
                                <p style="margin: 4px 0; color: #999; font-size: 12px;">${cargo.latitude.toFixed(6)}, ${cargo.longitude.toFixed(6)}</p>
                            </div>
                        `,
                        iconCaption: `${index + 1}. ${cargo.name}`,
                        hintContent: cargo.name
                    }, {
                        preset: 'islands#blueCircleDotIcon',
                        iconColor: '#007bff'
                    });

                    mapInstanceRef.current.geoObjects.add(placemark);
                    placemarksRef.current.push(placemark);
                }
            });

            // Если есть грузы, подстраиваем карту так, чтобы все метки были видны
            if (cargos.length > 0 && placemarksRef.current.length > 0) {
                const bounds = mapInstanceRef.current.geoObjects.getBounds();
                if (bounds) {
                    mapInstanceRef.current.setBounds(bounds, {
                        duration: 300,
                        padding: [50, 50]
                    });
                }
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                // Удаляем все метки перед уничтожением карты
                placemarksRef.current.forEach((placemark) => {
                    mapInstanceRef.current.geoObjects.remove(placemark);
                });
                placemarksRef.current = [];
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [cargos, height]);

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height, margin: '20px 0', borderRadius: '12px', overflow: 'hidden' }} />
            {cargos.length > 0 && (
                <div style={{ marginTop: '10px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        <strong>Всего грузов на карте:</strong> {cargos.length}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MultiMapView;

