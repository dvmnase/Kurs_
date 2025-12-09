import React, { useEffect, useRef } from 'react';

interface RouteMapViewProps {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    startAddress?: string;
    endAddress?: string;
    height?: string;
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

    useEffect(() => {
        if (mapRef.current && startLat && startLng && endLat && endLng) {
            // Очищаем предыдущую карту
            mapRef.current.innerHTML = '';
            
            // Создаем iframe с маршрутом используя простой способ через Google Maps
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = height;
            iframe.frameBorder = '0';
            iframe.style.border = '0';
            // Используем простой способ отображения маршрута через directions
            iframe.src = `https://www.google.com/maps?q=${startLat},${startLng}&ll=${endLat},${endLng}&z=10&output=embed`;
            iframe.allowFullScreen = true;
            
            mapRef.current.appendChild(iframe);
        }
    }, [startLat, startLng, endLat, endLng, height]);

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height, margin: '20px 0' }} />
            {startAddress && (
                <p style={{ marginTop: '10px' }}>
                    <strong>От:</strong> {startAddress} ({startLat.toFixed(7)}, {startLng.toFixed(7)})
                </p>
            )}
            {endAddress && (
                <p style={{ marginTop: '5px' }}>
                    <strong>До:</strong> {endAddress} ({endLat.toFixed(7)}, {endLng.toFixed(7)})
                </p>
            )}
        </div>
    );
};

export default RouteMapView;

