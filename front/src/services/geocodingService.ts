import api from './api';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    address: string;
}

export const geocodingService = {
    geocodeAddress: async (address: string): Promise<GeocodeResult | null> => {
        try {
            if (!address || address.trim().length === 0) {
                return null;
            }
            
            // Используем бэкенд для геокодинга
            const response = await api.get('/api/geocoding/geocode', {
                params: { address: address.trim() }
            });
            
            // Проверяем, есть ли ошибка в ответе
            if (response.data && response.data.error) {
                console.warn('Geocoding: Address not found:', address);
                return null;
            }
            
            // Проверяем, что координаты валидны (любая страна)
            if (response.data && response.data.latitude && response.data.longitude) {
                const lat = parseFloat(response.data.latitude);
                const lng = parseFloat(response.data.longitude);
                
                // Проверяем, что координаты валидны (в пределах глобальных границ)
                if (!isNaN(lat) && !isNaN(lng) && 
                    lat >= -90 && lat <= 90 && 
                    lng >= -180 && lng <= 180) {
                    return {
                        latitude: lat,
                        longitude: lng,
                        address: response.data.address || address
                    };
                } else {
                    console.warn('Geocoding: Invalid coordinates:', lat, lng);
                    return null;
                }
            }
            
            return null;
        } catch (error: any) {
            console.warn('Geocoding error:', error);
            return null;
        }
    },

    reverseGeocode: async (latitude: number, longitude: number): Promise<string | null> => {
        try {
            if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
                console.error('Reverse geocoding error: Invalid coordinates');
                return null;
            }
            
            const response = await api.get('/api/geocoding/reverse', {
                params: { latitude, longitude }
            });
            
            if (response.data && response.data.address) {
                return response.data.address;
            }
            
            console.error('Reverse geocoding error: Invalid response format');
            return null;
        } catch (error: any) {
            console.error('Reverse geocoding error:', error);
            if (error.response?.data?.error) {
                console.error('Server error:', error.response.data.error);
            }
            return null;
        }
    }
};




