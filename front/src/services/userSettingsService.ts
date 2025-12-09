import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface UserSettings {
    fullName: string;
    email: string;
    phone: string;
    currentPassword?: string;
    newPassword?: string;
}

class UserSettingsService {
    async getUserSettings(): Promise<UserSettings> {
        const response = await axios.get(`${API_URL}/user/settings`);
        return response.data;
    }

    async updateProfile(settings: UserSettings): Promise<void> {
        await axios.put(`${API_URL}/user/settings/profile`, settings);
    }

    async updatePassword(settings: UserSettings): Promise<void> {
        await axios.put(`${API_URL}/user/settings/password`, settings);
    }
}

export const userSettingsService = new UserSettingsService(); 