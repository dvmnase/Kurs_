import api from './api';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    address: string;
}

export const geocodingService = {
    geocodeAddress: async (address: string): Promise<GeocodeResult | null> => {
        try {
            const response = await api.get('/api/geocoding/geocode', {
                params: { address }
            });
            return response.data;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    },

    reverseGeocode: async (latitude: number, longitude: number): Promise<string | null> => {
        try {
            const response = await api.get('/api/geocoding/reverse', {
                params: { latitude, longitude }
            });
            return response.data.address;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }
};


