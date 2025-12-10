import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../../services/authService';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ChatBot from '../../components/ChatBot';
import { geocodingService } from '../../services/geocodingService';
import MapView from '../../components/MapView';
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

    const handleAddressChange = async (address: string) => {
        // Сразу обновляем адрес в форме и очищаем координаты
        setFormData(prev => ({ 
            ...prev, 
            address,
            latitude: '',  // Очищаем координаты при вводе адреса
            longitude: ''  // Очищаем координаты при вводе адреса
        }));
        
        // Очищаем предыдущий таймаут
        if (addressTimeoutRef.current) {
            clearTimeout(addressTimeoutRef.current);
        }
        
        // Ждем 300мс после окончания ввода для быстрого отклика
        addressTimeoutRef.current = setTimeout(async () => {
            if (address && address.trim().length > 3) {
                setGeocodingLoading(true);
                try {
                    const result = await geocodingService.geocodeAddress(address);
                    if (result) {
                        // Обновляем и адрес, и координаты
                        setFormData(prev => ({
                            ...prev,
                            address: result.address,
                            latitude: result.latitude.toString(),
                            longitude: result.longitude.toString()
                        }));
                        // Очищаем ошибку, если координаты найдены
                        setError(null);
                    }
                    // Если не удалось найти координаты, просто не обновляем их
                    // Пользователь может продолжить ввод или ввести координаты вручную
                } catch (err) {
                    console.error('Ошибка геокодинга:', err);
                    // Не показываем ошибку пользователю, просто не обновляем координаты
                } finally {
                    setGeocodingLoading(false);
                }
            }
        }, 300);
    };

    const handleCoordinatesChange = async (lat: string, lng: string) => {
        // Сразу обновляем координаты в форме и очищаем адрес
        setFormData(prev => ({ 
            ...prev, 
            latitude: lat, 
            longitude: lng,
            address: ''  // Очищаем адрес при вводе координат
        }));
        
        // Очищаем предыдущий таймаут
        if (coordsTimeoutRef.current) {
            clearTimeout(coordsTimeoutRef.current);
        }
        
        // Ждем 300мс после окончания ввода для быстрого отклика
        coordsTimeoutRef.current = setTimeout(async () => {
            if (lat && lng) {
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
                    setGeocodingLoading(true);
                    try {
                        const address = await geocodingService.reverseGeocode(latNum, lngNum);
                        if (address) {
                            // Обновляем и координаты, и адрес
                            setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                address: address
                            }));
                        } else {
                            // Если не удалось найти адрес, показываем ошибку
                            setError('Не удалось определить адрес по координатам.');
                        }
                    } catch (err) {
                        console.error('Ошибка обратного геокодинга:', err);
                        setError('Ошибка при определении адреса. Попробуйте ввести адрес вручную.');
                    } finally {
                        setGeocodingLoading(false);
                    }
                }
            }
        }, 300);
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
        if (navigator.geolocation) {
            setGeocodingLoading(true);
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
                    setError('Не удалось определить ваше местоположение. Пожалуйста, введите координаты вручную.');
                    setGeocodingLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setError('Ваш браузер не поддерживает определение местоположения.');
        }
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
        <Layout navigationPaths={navigation} showLogout onLogout={() => { authService.logout(); router.push('/'); }}>
            <div className={styles.container}>
                <h1>Управление грузами</h1>
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
                    <button onClick={() => setShowCreateModal(true)}>Создать груз</button>
                    <button onClick={handleExportExcel}>Экспорт в Excel</button>
                </div>
                
                {showCreateModal && (
                    <div className={styles.modal}>
                        <form onSubmit={handleCreateCargo}>
                            <h2>Создать груз</h2>
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
                                <label>Адрес (автоматически определит координаты):</label>
                                <input
                                    type="text"
                                    placeholder="Введите адрес..."
                                    value={formData.address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                />
                                {geocodingLoading && <div style={{ fontSize: '12px', color: '#666' }}>Определение координат...</div>}
                            </div>
                            <div>
                                <label>Координаты (автоматически определит адрес):</label>
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
                                <button type="button" onClick={handleGetLocation} style={{ marginTop: '5px' }}>
                                    Определить текущее местоположение
                                </button>
                                {geocodingLoading && <div style={{ fontSize: '12px', color: '#666' }}>Определение адреса...</div>}
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
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit">Создать</button>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Отмена</button>
                            </div>
                        </form>
                    </div>
                )}

                {showEditModal && editingCargo && (
                    <div className={styles.modal}>
                        <form onSubmit={handleUpdateCargo}>
                            <h2>Редактировать груз: {editingCargo.name}</h2>
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
                                <label>Адрес:</label>
                                <input
                                    type="text"
                                    placeholder="Введите адрес..."
                                    value={formData.address}
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                />
                                {geocodingLoading && <div style={{ fontSize: '12px', color: '#666' }}>Определение координат...</div>}
                            </div>
                            <div>
                                <label>Координаты:</label>
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
                                <button type="button" onClick={handleGetLocation} style={{ marginTop: '5px' }}>
                                    Определить текущее местоположение
                                </button>
                                {geocodingLoading && <div style={{ fontSize: '12px', color: '#666' }}>Определение адреса...</div>}
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
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit">Сохранить</button>
                                <button type="button" onClick={() => {
                                    setShowEditModal(false);
                                    setEditingCargo(null);
                                }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                )}

                {showMap && selectedCargo && selectedCargo.location && (
                    <div className={styles.modal}>
                        <h2>Местоположение груза: {selectedCargo.name}</h2>
                        <MapView
                            latitude={selectedCargo.location.latitude}
                            longitude={selectedCargo.location.longitude}
                            address={selectedCargo.location.address}
                        />
                        <button onClick={() => setShowMap(false)}>Закрыть</button>
                    </div>
                )}

                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.list}>
                        {cargos.map((cargo) => (
                            <div key={cargo.id} className={styles.item}>
                                <h3>{cargo.name}</h3>
                                <p>{cargo.description}</p>
                                {cargo.weight && <p>Вес: {cargo.weight} кг</p>}
                                {cargo.location && (
                                    <div>
                                        <p>Адрес: {cargo.location.address}</p>
                                        <p>Координаты: {cargo.location.latitude.toFixed(7)}, {cargo.location.longitude.toFixed(7)}</p>
                                        <button onClick={() => handleViewOnMap(cargo)}>Показать на карте</button>
                                    </div>
                                )}
                                <button onClick={() => handleEditCargo(cargo)}>Редактировать</button>
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
