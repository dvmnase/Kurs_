import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import { geocodingService } from '../../services/geocodingService';
import MapView from '../../components/MapView';
import MultiMapView from '../../components/MultiMapView';
import styles from '../../styles/client/ClientHome.module.sass';

interface Cargo {
    id: number;
    name: string;
    description: string;
    weight: number;
    createdAt: string;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    };
}

const OwnerCargoPage = () => {
    const router = useRouter();
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
    const [showAllCargosMap, setShowAllCargosMap] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [minWeight, setMinWeight] = useState('');
    const [maxWeight, setMaxWeight] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        weight: '',
        latitude: '',
        longitude: '',
        address: ''
    });
    const [geocodingLoading, setGeocodingLoading] = useState(false);
    const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const coordsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!authService.isAuthenticated() || !authService.isOwner()) {
            router.push('/');
            return;
        }
        fetchCargos();
    }, [searchTerm, sortBy, sortOrder, minWeight, maxWeight]);

    const fetchCargos = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (sortBy) params.sortBy = sortBy;
            if (sortOrder) params.sortOrder = sortOrder;
            if (minWeight) params.minWeight = parseFloat(minWeight);
            if (maxWeight) params.maxWeight = parseFloat(maxWeight);
            
            const response = await api.get('/api/owner/cargo', { params });
            setCargos(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при загрузке грузов');
            } else {
                setError('Ошибка при загрузке грузов');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddressChange = (address: string) => {
        // Только обновляем адрес в форме - никакого автозаполнения
        // MapView сам выполнит геокодинг через Yandex Maps API и обновит координаты
        setFormData(prev => ({ 
            ...prev, 
            address,
            // Очищаем координаты при изменении адреса, чтобы MapView мог их обновить
            latitude: '',
            longitude: ''
        }));
    };

    const handleCoordinatesChange = async (lat: string, lng: string) => {
        // Сразу обновляем координаты в форме
        setFormData(prev => ({ 
            ...prev, 
            latitude: lat, 
            longitude: lng
        }));
        
        // Очищаем предыдущий таймаут
        if (coordsTimeoutRef.current) {
            clearTimeout(coordsTimeoutRef.current);
        }
        
        // Ждем 500мс после окончания ввода для обратного геокодинга
        coordsTimeoutRef.current = setTimeout(async () => {
            if (lat && lng) {
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
                    setGeocodingLoading(true);
                    try {
                        const address = await geocodingService.reverseGeocode(latNum, lngNum);
                        if (address) {
                            // При вводе координат всегда обновляем адрес
                            setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                address: address
                            }));
                        }
                    } catch (err) {
                        console.error('Ошибка обратного геокодинга:', err);
                        // Не показываем ошибку, просто не обновляем адрес
                    } finally {
                        setGeocodingLoading(false);
                    }
                }
            }
        }, 500);
    };

    const handleCreateCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            
            // Если указан адрес, но координаты не определены, пытаемся определить их
            let finalLatitude = formData.latitude;
            let finalLongitude = formData.longitude;
            let finalAddress = formData.address;
            
            if (formData.address && formData.address.trim().length > 5 && (!formData.latitude || !formData.longitude)) {
                setGeocodingLoading(true);
                try {
                    const result = await geocodingService.geocodeAddress(formData.address);
                    if (result) {
                        finalLatitude = result.latitude.toString();
                        finalLongitude = result.longitude.toString();
                        finalAddress = result.address;
                    } else {
                        setError('Не удалось определить координаты по адресу. Пожалуйста, введите координаты вручную.');
                        setGeocodingLoading(false);
                        return;
                    }
                } catch (err) {
                    setError('Ошибка при определении координат. Пожалуйста, введите координаты вручную.');
                    setGeocodingLoading(false);
                    return;
                } finally {
                    setGeocodingLoading(false);
                }
            }
            
            await api.post('/api/owner/cargo', {
                name: formData.name,
                description: formData.description,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                latitude: finalLatitude ? parseFloat(finalLatitude) : null,
                longitude: finalLongitude ? parseFloat(finalLongitude) : null,
                address: finalAddress
            });
            setShowCreateModal(false);
            setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
            fetchCargos();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при создании груза');
            } else {
                setError('Ошибка при создании груза');
            }
        }
    };

    const handleEditCargo = (cargo: Cargo) => {
        setEditingCargo(cargo);
        setFormData({
            name: cargo.name,
            description: cargo.description || '',
            weight: cargo.weight ? cargo.weight.toString() : '',
            latitude: cargo.location?.latitude?.toString() || '',
            longitude: cargo.location?.longitude?.toString() || '',
            address: cargo.location?.address || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteCargo = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот груз? Это действие нельзя отменить.')) {
            return;
        }
        try {
            setError(null);
            await api.delete(`/api/owner/cargo/${id}`);
            fetchCargos();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при удалении груза');
            } else {
                setError('Ошибка при удалении груза');
            }
        }
    };

    const handleUpdateCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCargo) return;
        try {
            setError(null);
            
            // Если указан адрес, но координаты не определены, пытаемся определить их
            let finalLatitude = formData.latitude;
            let finalLongitude = formData.longitude;
            let finalAddress = formData.address;
            
            if (formData.address && formData.address.trim().length > 5 && (!formData.latitude || !formData.longitude)) {
                setGeocodingLoading(true);
                try {
                    const result = await geocodingService.geocodeAddress(formData.address);
                    if (result) {
                        finalLatitude = result.latitude.toString();
                        finalLongitude = result.longitude.toString();
                        finalAddress = result.address;
                    } else {
                        setError('Не удалось определить координаты по адресу. Пожалуйста, введите координаты вручную.');
                        setGeocodingLoading(false);
                        return;
                    }
                } catch (err) {
                    setError('Ошибка при определении координат. Пожалуйста, введите координаты вручную.');
                    setGeocodingLoading(false);
                    return;
                } finally {
                    setGeocodingLoading(false);
                }
            }
            
            await api.put(`/api/owner/cargo/${editingCargo.id}`, {
                name: formData.name,
                description: formData.description,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                latitude: finalLatitude ? parseFloat(finalLatitude) : null,
                longitude: finalLongitude ? parseFloat(finalLongitude) : null,
                address: finalAddress
            });
            setShowEditModal(false);
            setEditingCargo(null);
            setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
            fetchCargos();
        } catch (err: any) {
            const errorMessage = err.response?.data;
            if (typeof errorMessage === 'string') {
                setError(errorMessage);
            } else if (errorMessage && typeof errorMessage === 'object') {
                setError(errorMessage.message || errorMessage.error || 'Ошибка при обновлении груза');
            } else {
                setError('Ошибка при обновлении груза');
            }
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/api/owner/cargo/export', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'cargos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            setError('Ошибка при экспорте');
        }
    };

    const handleViewOnMap = (cargo: Cargo) => {
        setSelectedCargo(cargo);
        setShowMap(true);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Ваш браузер не поддерживает определение местоположения. Пожалуйста, введите координаты вручную или кликните на карте.');
            return;
        }

        setGeocodingLoading(true);
        setError(null); // Очищаем предыдущие ошибки

        navigator.geolocation.getCurrentPosition(
            (position) => {
                handleCoordinatesChange(
                    position.coords.latitude.toString(),
                    position.coords.longitude.toString()
                );
                setGeocodingLoading(false);
            },
            (error) => {
                console.error('Ошибка получения местоположения:', error);
                setGeocodingLoading(false);
                
                let errorMessage = 'Не удалось определить ваше местоположение. ';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Доступ к геолокации запрещен. ';
                        errorMessage += 'Пожалуйста, разрешите доступ к местоположению в настройках браузера или введите координаты вручную. ';
                        errorMessage += 'Вы также можете кликнуть на карте, чтобы указать местоположение.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Местоположение недоступно. ';
                        errorMessage += 'Пожалуйста, введите координаты вручную или кликните на карте.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Превышено время ожидания. ';
                        errorMessage += 'Пожалуйста, попробуйте еще раз или введите координаты вручную.';
                        break;
                    default:
                        errorMessage += 'Пожалуйста, введите координаты вручную или кликните на карте.';
                        break;
                }
                
                setError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000, // Увеличиваем таймаут до 15 секунд
                maximumAge: 60000 // Разрешаем использовать кэшированные данные до 1 минуты
            }
        );
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
        <Layout title="Мои грузы" navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>Управление грузами</h1>
                    <p style={{ color: '#666', marginTop: '8px' }}>Создавайте и управляйте своими грузами</p>
                </div>
                {error && <div className={styles.error}>{error}</div>}
                
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="createdAt">По дате</option>
                        <option value="name">По названию</option>
                        <option value="weight">По весу</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="asc">По возрастанию</option>
                        <option value="desc">По убыванию</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Мин. вес"
                        value={minWeight}
                        onChange={(e) => setMinWeight(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Макс. вес"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                    />
                </div>

                <div className={styles.actions}>
                    <button onClick={() => {
                        // Очищаем таймауты
                        if (addressTimeoutRef.current) {
                            clearTimeout(addressTimeoutRef.current);
                            addressTimeoutRef.current = null;
                        }
                        if (coordsTimeoutRef.current) {
                            clearTimeout(coordsTimeoutRef.current);
                            coordsTimeoutRef.current = null;
                        }
                        // Очищаем данные формы
                        setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
                        setShowCreateModal(true);
                    }}>Создать груз</button>
                    <button onClick={handleExportExcel}>Экспорт в Excel</button>
                    <button onClick={() => setShowAllCargosMap(true)}>Просмотреть все грузы на карте</button>
                </div>
                
                {showCreateModal && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            // Очищаем таймауты
                            if (addressTimeoutRef.current) {
                                clearTimeout(addressTimeoutRef.current);
                                addressTimeoutRef.current = null;
                            }
                            if (coordsTimeoutRef.current) {
                                clearTimeout(coordsTimeoutRef.current);
                                coordsTimeoutRef.current = null;
                            }
                            // Очищаем данные формы
                            setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
                            setShowCreateModal(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <form onSubmit={handleCreateCargo}>
                                <h2>📦 Создать груз</h2>
                            <input
                                type="text"
                                placeholder="Название"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Описание"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Вес (кг)"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                            <div>
                                <label>📍 Адрес (автоматически определит координаты)</label>
                                <input
                                    type="text"
                                    placeholder="Введите адрес..."
                                    value={formData.address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                />
                                {geocodingLoading && <div style={{ fontSize: '13px', color: '#007bff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⏳</span> Определение координат...
                                </div>}
                            </div>
                            <div>
                                <label>🌐 Координаты (автоматически определит адрес)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Широта"
                                        value={formData.latitude}
                                        onChange={(e) => handleCoordinatesChange(e.target.value, formData.longitude)}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Долгота"
                                        value={formData.longitude}
                                        onChange={(e) => handleCoordinatesChange(formData.latitude, e.target.value)}
                                    />
                                </div>
                                <button type="button" onClick={handleGetLocation} style={{ marginTop: '10px', padding: '10px 16px', background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)', transition: 'all 0.3s ease' }}>
                                    📍 Определить текущее местоположение
                                </button>
                                {geocodingLoading && <div style={{ fontSize: '13px', color: '#007bff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⏳</span> Определение адреса...
                                </div>}
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <MapView
                                    latitude={formData.latitude || undefined}
                                    longitude={formData.longitude || undefined}
                                    address={formData.address || undefined}
                                    height="300px"
                                    onCoordinatesChange={(lat, lng) => {
                                        handleCoordinatesChange(lat.toString(), lng.toString());
                                    }}
                                    onAddressChange={(address) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            address: address
                                        }));
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit">Создать</button>
                                <button type="button" onClick={() => {
                                    // Очищаем таймауты
                                    if (addressTimeoutRef.current) {
                                        clearTimeout(addressTimeoutRef.current);
                                        addressTimeoutRef.current = null;
                                    }
                                    if (coordsTimeoutRef.current) {
                                        clearTimeout(coordsTimeoutRef.current);
                                        coordsTimeoutRef.current = null;
                                    }
                                    // Очищаем данные формы
                                    setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
                                    setShowCreateModal(false);
                                }}>Отмена</button>
                            </div>
                        </form>
                        </div>
                    </div>
                )}

                {showEditModal && editingCargo && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            // Очищаем таймауты
                            if (addressTimeoutRef.current) {
                                clearTimeout(addressTimeoutRef.current);
                                addressTimeoutRef.current = null;
                            }
                            if (coordsTimeoutRef.current) {
                                clearTimeout(coordsTimeoutRef.current);
                                coordsTimeoutRef.current = null;
                            }
                            // Очищаем данные формы
                            setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
                            setShowEditModal(false);
                            setEditingCargo(null);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <form onSubmit={handleUpdateCargo}>
                                <h2>✏️ Редактировать груз: {editingCargo.name}</h2>
                            <input
                                type="text"
                                placeholder="Название"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Описание"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Вес (кг)"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                            <div>
                                <label>📍 Адрес</label>
                                <input
                                    type="text"
                                    placeholder="Введите адрес..."
                                    value={formData.address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                />
                                {geocodingLoading && <div style={{ fontSize: '13px', color: '#007bff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⏳</span> Определение координат...
                                </div>}
                            </div>
                            <div>
                                <label>🌐 Координаты</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Широта"
                                        value={formData.latitude}
                                        onChange={(e) => handleCoordinatesChange(e.target.value, formData.longitude)}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Долгота"
                                        value={formData.longitude}
                                        onChange={(e) => handleCoordinatesChange(formData.latitude, e.target.value)}
                                    />
                                </div>
                                <button type="button" onClick={handleGetLocation} style={{ marginTop: '10px', padding: '10px 16px', background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)', transition: 'all 0.3s ease' }}>
                                    📍 Определить текущее местоположение
                                </button>
                                {geocodingLoading && <div style={{ fontSize: '13px', color: '#007bff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⏳</span> Определение адреса...
                                </div>}
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <MapView
                                    latitude={formData.latitude || undefined}
                                    longitude={formData.longitude || undefined}
                                    address={formData.address || undefined}
                                    height="300px"
                                    onCoordinatesChange={(lat, lng) => {
                                        handleCoordinatesChange(lat.toString(), lng.toString());
                                    }}
                                    onAddressChange={(address) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            address: address
                                        }));
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit">Сохранить</button>
                                <button type="button" onClick={() => {
                                    // Очищаем таймауты
                                    if (addressTimeoutRef.current) {
                                        clearTimeout(addressTimeoutRef.current);
                                        addressTimeoutRef.current = null;
                                    }
                                    if (coordsTimeoutRef.current) {
                                        clearTimeout(coordsTimeoutRef.current);
                                        coordsTimeoutRef.current = null;
                                    }
                                    // Очищаем данные формы
                                    setFormData({ name: '', description: '', weight: '', latitude: '', longitude: '', address: '' });
                                    setShowEditModal(false);
                                    setEditingCargo(null);
                                }}>Отмена</button>
                            </div>
                        </form>
                        </div>
                    </div>
                )}

                {showMap && selectedCargo && selectedCargo.location && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowMap(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <h2>🗺️ Местоположение груза: {selectedCargo.name}</h2>
                            <MapView
                                latitude={selectedCargo.location.latitude}
                                longitude={selectedCargo.location.longitude}
                                address={selectedCargo.location.address}
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowMap(false)} style={{ flex: 1 }}>Закрыть</button>
                            </div>
                        </div>
                    </div>
                )}

                {showAllCargosMap && (
                    <div className={styles.modalOverlay} onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAllCargosMap(false);
                        }
                    }}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
                            <h2>Все грузы на карте</h2>
                            <MultiMapView
                                cargos={cargos
                                    .filter(cargo => cargo.location)
                                    .map(cargo => ({
                                        id: cargo.id,
                                        name: cargo.name,
                                        latitude: cargo.location!.latitude,
                                        longitude: cargo.location!.longitude,
                                        address: cargo.location!.address
                                    }))}
                                height="600px"
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowAllCargosMap(false)} style={{ flex: 1 }}>Закрыть</button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#666' }}>
                        <div style={{ marginBottom: '16px' }}>⏳</div>
                        Загрузка грузов...
                    </div>
                ) : cargos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>Нет грузов</h3>
                        <p style={{ color: '#666', marginBottom: '24px' }}>Создайте свой первый груз, нажав кнопку "Создать груз"</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {cargos.map((cargo) => (
                            <div key={cargo.id} className={styles.item}>
                                <h3>{cargo.name}</h3>
                                <p>{cargo.description}</p>
                                {cargo.weight && <p>Вес: {cargo.weight} кг</p>}
                                {cargo.location && (
                                    <div className={styles.locationInfo}>
                                        <p><strong>📍 Адрес:</strong> {cargo.location.address}</p>
                                        <p><strong>🌐 Координаты:</strong> {cargo.location.latitude.toFixed(7)}, {cargo.location.longitude.toFixed(7)}</p>
                                    </div>
                                )}
                                <div className={styles.buttonGroup}>
                                    {cargo.location && (
                                        <button onClick={() => handleViewOnMap(cargo)}>🗺️ На карте</button>
                                    )}
                                    <button onClick={() => handleEditCargo(cargo)}>✏️ Редактировать</button>
                                    <button onClick={() => handleDeleteCargo(cargo.id)} style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)' }}>
                                        🗑️ Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <ChatBot />
            </div>
        </Layout>
    );
};

export default OwnerCargoPage;
