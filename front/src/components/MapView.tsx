import React, { useEffect, useRef } from 'react';

interface MapViewProps {
    latitude: number;
    longitude: number;
    address?: string;
    height?: string;
}

const MapView: React.FC<MapViewProps> = ({ latitude, longitude, address, height = '400px' }) => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mapRef.current && latitude && longitude) {
            // Очищаем предыдущую карту
            mapRef.current.innerHTML = '';
            
            // Создаем iframe с картой
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = height;
            iframe.frameBorder = '0';
            iframe.style.border = '0';
            iframe.src = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`;
            iframe.allowFullScreen = true;
            
            mapRef.current.appendChild(iframe);
        }
    }, [latitude, longitude, height]);

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height, margin: '20px 0' }} />
            {address && (
                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                    <strong>Адрес:</strong> {address}
                </p>
            )}
            <p style={{ marginTop: '5px', color: '#666' }}>
                <strong>Координаты:</strong> {latitude.toFixed(7)}, {longitude.toFixed(7)}
            </p>
        </div>
    );
};

export default MapView;


