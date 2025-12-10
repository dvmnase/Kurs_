import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import { geocodingService } from '../../services/geocodingService';
import RouteMapView from '../../components/RouteMapView';
import styles from '../../styles/client/ClientHome.module.sass';

interface Route {
    id: number;
    cargoId: number;
    startAddress: string;
    endAddress: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
}

interface Cargo {
    id: number;
    name: string;
}

const OwnerRoutesPage = () => {
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [formData, setFormData] = useState({
        cargoId: '',
        startAddress: '',
        endAddress: '',
        startLat: '',
        startLng: '',
        endLat: '',
        endLng: ''
    });
    const [geocodingLoading, setGeocodingLoading] = useState({ start: false, end: false });
    const startAddressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const endAddressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startCoordsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const endCoordsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/');
            return;
        }
        fetchRoutes();
        fetchCargos();
    }, []);

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/owner/routes');
            setRoutes(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке маршрутов');
            } else {
                setError('Ошибка при загрузке маршрутов');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCargos = async () => {
        try {
            const response = await api.get('/api/owner/cargo');
            setCargos(response.data);
        } catch (err: any) {
            console.error('Ошибка при загрузке грузов:', err);
        }
    };

    const handleAddressChange = async (address: string, type: 'start' | 'end') => {
        // Сразу обновляем адрес в форме и очищаем координаты
        if (type === 'start') {
            setFormData(prev => ({ 
                ...prev, 
                startAddress: address,
                startLat: '',  // Очищаем координаты при вводе адреса
                startLng: ''   // Очищаем координаты при вводе адреса
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                endAddress: address,
                endLat: '',  // Очищаем координаты при вводе адреса
                endLng: ''   // Очищаем координаты при вводе адреса
            }));
        }
        
        const timeoutRef = type === 'start' ? startAddressTimeoutRef : endAddressTimeoutRef;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(async () => {
            if (address && address.trim().length > 3) {
                if (type === 'start') {
                    setGeocodingLoading(prev => ({ ...prev, start: true }));
                } else {
                    setGeocodingLoading(prev => ({ ...prev, end: true }));
                }
                
                try {
                    const result = await geocodingService.geocodeAddress(address);
                    if (result) {
                        if (type === 'start') {
                            // Обновляем и адрес, и координаты для начальной точки
                            setFormData(prev => ({
                                ...prev,
                                startAddress: result.address,
                                startLat: result.latitude.toString(),
                                startLng: result.longitude.toString()
                            }));
                        } else {
                            // Обновляем и адрес, и координаты для конечной точки
                            setFormData(prev => ({
                                ...prev,
                                endAddress: result.address,
                                endLat: result.latitude.toString(),
                                endLng: result.longitude.toString()
                            }));
                        }
                        // Очищаем ошибку, если координаты найдены
                        setError(null);
                    }
                    // Если не удалось найти координаты, просто не обновляем их
                } catch (err) {
                    console.error('Ошибка геокодинга:', err);
                    // Не показываем ошибку пользователю
                } finally {
                    if (type === 'start') {
                        setGeocodingLoading(prev => ({ ...prev, start: false }));
                    } else {
                        setGeocodingLoading(prev => ({ ...prev, end: false }));
                    }
                }
            }
        }, 300);
    };

    const handleCoordinatesChange = async (lat: string, lng: string, type: 'start' | 'end') => {
        // Сразу обновляем координаты в форме и очищаем адрес
        if (type === 'start') {
            setFormData(prev => ({ 
                ...prev, 
                startLat: lat, 
                startLng: lng,
                startAddress: ''  // Очищаем адрес при вводе координат
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                endLat: lat, 
                endLng: lng,
                endAddress: ''  // Очищаем адрес при вводе координат
            }));
        }
        
        const timeoutRef = type === 'start' ? startCoordsTimeoutRef : endCoordsTimeoutRef;
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(async () => {
            if (lat && lng) {
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
                    if (type === 'start') {
                        setGeocodingLoading(prev => ({ ...prev, start: true }));
                    } else {
                        setGeocodingLoading(prev => ({ ...prev, end: true }));
                    }
                    
                    try {
                        const address = await geocodingService.reverseGeocode(latNum, lngNum);
                        if (address) {
                            if (type === 'start') {
                                // Обновляем и координаты, и адрес для начальной точки
                                setFormData(prev => ({
                                    ...prev,
                                    startLat: lat,
                                    startLng: lng,
                                    startAddress: address
                                }));
                            } else {
                                // Обновляем и координаты, и адрес для конечной точки
                                setFormData(prev => ({
                                    ...prev,
                                    endLat: lat,
                                    endLng: lng,
                                    endAddress: address
                                }));
                            }
                        } else {
                            setError(`Не удалось определить адрес для ${type === 'start' ? 'координат отправления' : 'координат назначения'}.`);
                        }
                    } catch (err) {
                        console.error('Ошибка обратного геокодинга:', err);
                        setError(`Ошибка при определении адреса для ${type === 'start' ? 'координат отправления' : 'координат назначения'}. Попробуйте ввести адрес вручную.`);
                    } finally {
                        if (type === 'start') {
                            setGeocodingLoading(prev => ({ ...prev, start: false }));
                        } else {
                            setGeocodingLoading(prev => ({ ...prev, end: false }));
                        }
                    }
                }
            }
        }, 300);
    };

    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            
            // Если указан адрес отправления, но координаты не определены, пытаемся определить их
            let finalStartLat = formData.startLat;
            let finalStartLng = formData.startLng;
            let finalStartAddress = formData.startAddress;
            
            if (formData.startAddress && formData.startAddress.trim().length > 5 && (!formData.startLat || !formData.startLng)) {
                setGeocodingLoading(prev => ({ ...prev, start: true }));
                try {
                    const result = await geocodingService.geocodeAddress(formData.startAddress);
                    if (result) {
                        finalStartLat = result.latitude.toString();
                        finalStartLng = result.longitude.toString();
                        finalStartAddress = result.address;
                    } else {
                        setError('Не удалось определить координаты для адреса отправления. Пожалуйста, введите координаты вручную.');
                        setGeocodingLoading(prev => ({ ...prev, start: false }));
                        return;
                    }
                } catch (err) {
                    setError('Ошибка при определении координат отправления. Пожалуйста, введите координаты вручную.');
                    setGeocodingLoading(prev => ({ ...prev, start: false }));
                    return;
                } finally {
                    setGeocodingLoading(prev => ({ ...prev, start: false }));
                }
            }
            
            // Если указан адрес назначения, но координаты не определены, пытаемся определить их
            let finalEndLat = formData.endLat;
            let finalEndLng = formData.endLng;
            let finalEndAddress = formData.endAddress;
            
            if (formData.endAddress && formData.endAddress.trim().length > 5 && (!formData.endLat || !formData.endLng)) {
                setGeocodingLoading(prev => ({ ...prev, end: true }));
                try {
                    const result = await geocodingService.geocodeAddress(formData.endAddress);
                    if (result) {
                        finalEndLat = result.latitude.toString();
                        finalEndLng = result.longitude.toString();
                        finalEndAddress = result.address;
                    } else {
                        setError('Не удалось определить координаты для адреса назначения. Пожалуйста, введите координаты вручную.');
                        setGeocodingLoading(prev => ({ ...prev, end: false }));
                        return;
                    }
                } catch (err) {
                    setError('Ошибка при определении координат назначения. Пожалуйста, введите координаты вручную.');
                    setGeocodingLoading(prev => ({ ...prev, end: false }));
                    return;
                } finally {
                    setGeocodingLoading(prev => ({ ...prev, end: false }));
                }
            }
            
            await api.post('/api/owner/routes', {
                cargoId: parseInt(formData.cargoId),
                startAddress: finalStartAddress,
                endAddress: finalEndAddress,
                startLat: finalStartLat ? parseFloat(finalStartLat) : null,
                startLng: finalStartLng ? parseFloat(finalStartLng) : null,
                endLat: finalEndLat ? parseFloat(finalEndLat) : null,
                endLng: finalEndLng ? parseFloat(finalEndLng) : null
            });
            setShowCreateModal(false);
            setFormData({ cargoId: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' });
            fetchRoutes();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при создании маршрута');
            } else {
                setError('Ошибка при создании маршрута');
            }
        }
    };

    const handleViewRoute = (route: Route) => {
        setSelectedRoute(route);
        setShowMap(true);
    };

    const navigation = {
        menu: [
            { title: 'Мои грузы', url: '/owner/cargo' },
            { title: 'Заявки', url: '/owner/requests' },
            { title: 'Маршруты', url: '/owner/routes' },
            { title: 'Настройки', url: '/owner/settings' },
        ],
    };

    return (
        <Layout title="Маршруты" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Управление маршрутами</h1>
                {error && <div className={styles.error}>{error}</div>}
                <button onClick={() => setShowCreateModal(true)}>Создать маршрут</button>
                
                {showCreateModal && (
                    <div className={styles.modal}>
                        <form onSubmit={handleCreateRoute}>
                            <h2>Создать маршрут</h2>
                            <select
                                value={formData.cargoId}
                                onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })}
                                required
                            >
                                <option value="">Выберите груз</option>
                                {cargos.map(cargo => (
                                    <option key={cargo.id} value={cargo.id}>{cargo.name}</option>
                                ))}
                            </select>
                            <div>
                                <h3>Точка отправления</h3>
                                <label>Адрес (автоматически определит координаты):</label>
                                <input
                                    type="text"
                                    placeholder="Адрес отправления"
                                    value={formData.startAddress}
                                    onChange={(e) => handleAddressChange(e.target.value, 'start')}
                                    required
                                />
                                {geocodingLoading.start && <div style={{ fontSize: '12px', color: '#666' }}>Определение координат...</div>}
                                <label>Координаты (автоматически определит адрес):</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Широта"
                                        value={formData.startLat}
                                        onChange={(e) => handleCoordinatesChange(e.target.value, formData.startLng, 'start')}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Долгота"
                                        value={formData.startLng}
                                        onChange={(e) => handleCoordinatesChange(formData.startLat, e.target.value, 'start')}
                                    />
                                </div>
                                {geocodingLoading.start && <div style={{ fontSize: '12px', color: '#666' }}>Определение адреса...</div>}
                            </div>
                            <div>
                                <h3>Точка назначения</h3>
                                <label>Адрес (автоматически определит координаты):</label>
                                <input
                                    type="text"
                                    placeholder="Адрес назначения"
                                    value={formData.endAddress}
                                    onChange={(e) => handleAddressChange(e.target.value, 'end')}
                                    required
                                />
                                {geocodingLoading.end && <div style={{ fontSize: '12px', color: '#666' }}>Определение координат...</div>}
                                <label>Координаты (автоматически определит адрес):</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Широта"
                                        value={formData.endLat}
                                        onChange={(e) => handleCoordinatesChange(e.target.value, formData.endLng, 'end')}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Долгота"
                                        value={formData.endLng}
                                        onChange={(e) => handleCoordinatesChange(formData.endLat, e.target.value, 'end')}
                                    />
                                </div>
                                {geocodingLoading.end && <div style={{ fontSize: '12px', color: '#666' }}>Определение адреса...</div>}
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <RouteMapView
                                    startLat={formData.startLat || undefined}
                                    startLng={formData.startLng || undefined}
                                    endLat={formData.endLat || undefined}
                                    endLng={formData.endLng || undefined}
                                    startAddress={formData.startAddress || undefined}
                                    endAddress={formData.endAddress || undefined}
                                    height="300px"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit">Создать</button>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                            </div>
                        </form>
                    </div>
                )}

                {showMap && selectedRoute && (
                    <div className={styles.modal}>
                        <h2>Маршрут #{selectedRoute.id}</h2>
                        <RouteMapView
                            startLat={selectedRoute.startLat}
                            startLng={selectedRoute.startLng}
                            endLat={selectedRoute.endLat}
                            endLng={selectedRoute.endLng}
                            startAddress={selectedRoute.startAddress}
                            endAddress={selectedRoute.endAddress}
                        />
                        <button onClick={() => setShowMap(false)}>Закрыть</button>
                    </div>
                )}

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {routes.map((route) => (
                            <div key={route.id} className={styles.item}>
                                <h3>Маршрут #{route.id}</h3>
                                <p><strong>От:</strong> {route.startAddress}</p>
                                <p><strong>До:</strong> {route.endAddress}</p>
                                <button onClick={() => handleViewRoute(route)}>Построить маршрут на карте</button>
                            </div>
                        ))}
                    </div>
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerRoutesPage;
