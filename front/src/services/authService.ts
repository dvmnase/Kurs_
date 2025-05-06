import axios from 'axios';

const API_URL = 'http://localhost:8080/auth';

export interface SignUpData {
    username: string;
    email: string;
    password: string;
    role: string;
    fullName: string;
    phoneNumber: string;
    address: string;
}

export interface SignInData {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    role: string;
    data: {
        id: number;
        fullName: string;
        phoneNumber: string;
        address?: string;
        position?: string;
        specialization?: string;
    } | null;
    isBlocked: boolean;
}

export interface UserData {
    id: number;
    fullName: string;
    phoneNumber: string;
    address?: string;
    position?: string;
    specialization?: string;
    role: string;
}

const isBrowser = typeof window !== 'undefined';

export interface AuthService {
    signUp: (data: SignUpData) => Promise<any>;
    signIn: (data: SignInData) => Promise<AuthResponse>;
    logout: () => void;
    getToken: () => string | null;
    getRole: () => string | null;
    getUser: () => UserData | null;
    isAuthenticated: () => boolean;
    getUserFullName: () => string | null;
    getClientId: () => number | null;
    getEmployeeId: () => number | null;
    isAdmin: () => boolean;
    isClient: () => boolean;
    isEmployee: () => boolean;
}

export const authService: AuthService = {
    signUp: async (data: SignUpData) => {
        const response = await axios.post(`${API_URL}/signup`, data);
        return response.data;
    },

    signIn: async (data: SignInData) => {
        try {
            console.log('Отправка запроса на вход:', data);
            const response = await axios.post<AuthResponse>(`${API_URL}/signin`, data);
            console.log('Ответ сервера:', response.data);

            if (response.data.role === 'BLOCKED' || response.data.isBlocked) {
                throw new Error('Ваш аккаунт заблокирован. Обратитесь к администратору.');
            }

            if (response.data.token && isBrowser) {
                const token = response.data.token;
                const role = response.data.role;
                const userData = response.data.data;

                console.log('Получены данные пользователя:', {
                    token,
                    role,
                    userData
                });

                localStorage.setItem('token', token);
                localStorage.setItem('role', role);

                // Сохраняем данные пользователя
                if (userData) {
                    console.log('Сохранение данных пользователя:', userData);
                    const fullUserData = {
                        ...userData,
                        role: role
                    };
                    localStorage.setItem('user', JSON.stringify(fullUserData));
                    console.log('Сохраненные данные пользователя:', fullUserData);
                } else if (role === 'ADMIN') {
                    // Для администратора сохраняем базовые данные
                    const adminData = {
                        id: 0,
                        fullName: 'Administrator',
                        role: role
                    };
                    localStorage.setItem('user', JSON.stringify(adminData));
                } else {
                    throw new Error('Данные пользователя не получены от сервера');
                }

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Create axios instance with auth header for testing
                const testInstance = axios.create({
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            return response.data;
        } catch (error: any) {
            console.error('Ошибка при входе:', error);
            throw error;
        }
    },

    logout: () => {
        if (isBrowser) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
        }
    },

    getToken: () => {
        if (!isBrowser) return null;
        const token = localStorage.getItem('token');
        console.log('Получен токен из localStorage:', token);
        return token;
    },

    getRole: () => {
        if (!isBrowser) return null;
        return localStorage.getItem('role');
    },

    getUser: () => {
        if (!isBrowser) return null;
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            const user = JSON.parse(userStr);
            if (!user) return null;
            return user;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    isAuthenticated: () => {
        if (!isBrowser) return false;
        const token = localStorage.getItem('token');
        console.log('Проверка аутентификации, токен:', token);
        return !!token;
    },

    getUserFullName: () => {
        if (!isBrowser) return null;
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            const user = JSON.parse(userStr);
            if (!user) return null;
            return user.fullName;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    getClientId: () => {
        if (!isBrowser) return null;
        const userStr = localStorage.getItem('user');
        console.log('Получение clientId из localStorage:', userStr);
        if (!userStr || userStr === 'undefined') return null;
        try {
            const user = JSON.parse(userStr);
            console.log('Распарсенные данные пользователя:', user);
            if (!user || user.role !== 'USER') return null;
            console.log('Возвращаемый clientId:', user.id);
            return user.id.toString();
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    getEmployeeId: () => {
        if (!isBrowser) return null;
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            const user = JSON.parse(userStr);
            if (!user || user.role !== 'EMPLOYEE') return null;
            return user.id.toString();
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    isAdmin: () => {
        if (!isBrowser) return false;
        const role = localStorage.getItem('role');
        return role === 'ADMIN';
    },

    isClient: () => {
        if (!isBrowser) return false;
        const role = localStorage.getItem('role');
        return role === 'USER';
    },

    isEmployee: () => {
        if (!isBrowser) return false;
        const role = localStorage.getItem('role');
        return role === 'EMPLOYEE';
    }
}; 